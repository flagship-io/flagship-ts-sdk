import { ALLOCATION, BUCKETING_NEW_ALLOCATION, BUCKETING_VARIATION_CACHE, GET_THIRD_PARTY_SEGMENT, THIRD_PARTY_SEGMENT_URL } from '../enum/FlagshipConstant';
import { IFlagshipConfig } from '../config/index';
import { LogLevel } from '../enum/index';
import { BucketingDTO, CampaignDTO, ThirdPartySegment, TroubleshootingLabel, VariationDTO, primitive } from '../types';
import { IHttpClient } from '../utils/HttpClient';
import { MurmurHash } from '../utils/MurmurHash';
import { errorFormat, logDebugSprintf, logError, sprintf } from '../utils/utils';
import { VisitorAbstract } from '../visitor/VisitorAbstract';
import { Targetings, VariationGroupDTO } from './api/bucketingDTO';
import { DecisionManager } from './DecisionManager';
import { ISdkManager } from '../main/ISdkManager';

type ConstructorParam = {
  httpClient: IHttpClient;
  config: IFlagshipConfig;
  murmurHash: MurmurHash;
  sdkManager: ISdkManager;
}
export class BucketingManager extends DecisionManager {
  private _murmurHash: MurmurHash;
  private _sdkManager: ISdkManager;

  private get _bucketingContent(): BucketingDTO | undefined {
    return this._sdkManager.getBucketingContent();
  }

  public constructor({ httpClient, config, murmurHash, sdkManager }: ConstructorParam) {
    super(httpClient, config);
    this._murmurHash = murmurHash;
    this._sdkManager = sdkManager;
  }

  private async sendContext(visitor: VisitorAbstract): Promise<void> {
    try {
      if (Object.keys(visitor.context).length <= 3 || !visitor.hasConsented || !visitor.hasContextBeenUpdated) {
        return;
      }

      const { Segment } = await import('../hit/Segment.ts');

      visitor.hasContextBeenUpdated = false;
      const SegmentHit = new Segment({
        context: visitor.context,
        visitorId: visitor.visitorId,
        anonymousId: visitor.anonymousId as string
      });

      await visitor.sendHit(SegmentHit);

      import('../hit/Troubleshooting.ts').then(({ Troubleshooting }) => {
        const hitTroubleshooting = new Troubleshooting({
          label: TroubleshootingLabel.VISITOR_SEND_HIT,
          logLevel: LogLevel.INFO,
          traffic: visitor.traffic || 0,
          visitorId: visitor.visitorId,
          visitorSessionId: visitor.instanceId,
          flagshipInstanceId: visitor.sdkInitialData?.instanceId,
          anonymousId: visitor.anonymousId,
          config: this.config,
          hitContent: SegmentHit.toApiKeys()
        });

        visitor.segmentHitTroubleshooting = hitTroubleshooting;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logError(this.config, error.message || error, 'sendContext');
    }
  }

  public async getThirdPartySegment(visitorId:string): Promise<Record<string, primitive>> {
    const url = sprintf(THIRD_PARTY_SEGMENT_URL, this.config.envId, visitorId);
    const now = Date.now();
    const contexts:Record<string, primitive> = {};
    try {
      const response = await this._httpClient.getAsync(url, { nextFetchConfig: this.config.nextFetchConfig });
      const content:ThirdPartySegment[] = response.body;
      if (Array.isArray(content)) {
        for (const item of content) {
          contexts[`${item.partner}::${item.segment}`] = item.value;
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logError(this.config, errorFormat(error.message || error, {
        url,
        nextFetchConfig: this.config.nextFetchConfig,
        duration: Date.now() - now
      }), GET_THIRD_PARTY_SEGMENT);
    }
    return contexts;
  }

  async getCampaignsAsync(visitor: VisitorAbstract): Promise<CampaignDTO[]|null> {
    if (!this._bucketingContent) {
      return null;
    }

    const troubleshooting = this._bucketingContent?.accountSettings?.troubleshooting;
    this.troubleshooting = undefined;
    if (troubleshooting) {
      this.troubleshooting = {
        startDate: new Date(troubleshooting.startDate),
        endDate: new Date(troubleshooting.endDate),
        timezone: troubleshooting.timezone,
        traffic: troubleshooting.traffic
      };
    }

    if (this._bucketingContent.panic) {
      this.panic = true;
      return [];
    }
    this.panic = false;

    if (!this._bucketingContent.campaigns) {
      return null;
    }

    if (this.config.fetchThirdPartyData) {
      const thirdPartySegments = await this.getThirdPartySegment(visitor.visitorId);
      visitor.updateContext(thirdPartySegments);
    }

    await this.sendContext(visitor);

    const visitorCampaigns: CampaignDTO[] = [];

    this._bucketingContent.campaigns.forEach(campaign => {
      const currentCampaigns = this.getVisitorCampaigns(campaign.variationGroups, campaign.id, campaign.type, visitor);
      if (currentCampaigns) {
        currentCampaigns.slug = campaign.slug ?? null;
        currentCampaigns.name = campaign.name;
        visitorCampaigns.push(currentCampaigns);
      }
    });
    return visitorCampaigns;
  }

  private getVisitorCampaigns(variationGroups: VariationGroupDTO[], campaignId: string, campaignType: string, visitor: VisitorAbstract): CampaignDTO | null {
    for (const variationGroup of variationGroups) {
      const check = this.isMatchTargeting(variationGroup, visitor);
      if (check) {
        const variation = this.getVariation(
          variationGroup,
          visitor
        );
        if (!variation) {
          return null;
        }
        return {
          id: campaignId,
          variation,
          variationGroupId: variationGroup.id,
          variationGroupName: variationGroup.name,
          type: campaignType
        };
      }
    }
    return null;
  }

  private getVariation(variationGroup: VariationGroupDTO, visitor: VisitorAbstract): VariationDTO | null {
    const hash = this._murmurHash.murmurHash3Int32(variationGroup.id + visitor.visitorId);
    const hashAllocation = hash % 100;
    let totalAllocation = 0;

    for (const variation of variationGroup.variations) {
      const assignmentsHistory = visitor.visitorCache?.data?.assignmentsHistory;
      const cacheVariationId = assignmentsHistory ? assignmentsHistory[variationGroup.id] : null;
      if (cacheVariationId) {
        const newVariation = variationGroup.variations.find(x => x.id === cacheVariationId);
        if (!newVariation) {
          continue;
        }
        logDebugSprintf(this.config, ALLOCATION, BUCKETING_VARIATION_CACHE, visitor.visitorId, newVariation.id);
        return {
          id: newVariation.id,
          name: newVariation.name,
          modifications: newVariation.modifications,
          reference: newVariation.reference
        };
      }

      if (variation.allocation === undefined || variation.allocation === 0) {
        continue;
      }
      totalAllocation += variation.allocation;

      if (hashAllocation < totalAllocation) {
        logDebugSprintf(this.config, ALLOCATION, BUCKETING_NEW_ALLOCATION, visitor.visitorId, variation.id, totalAllocation);
        return {
          id: variation.id,
          modifications: variation.modifications,
          reference: variation.reference,
          name: variation.name
        };
      }
    }
    return null;
  }

  private isMatchTargeting(variationGroup: VariationGroupDTO, visitor: VisitorAbstract): boolean {
    if (!variationGroup || !variationGroup.targeting || !variationGroup.targeting.targetingGroups) {
      return false;
    }
    return variationGroup.targeting.targetingGroups.some(
      targetingGroup => this.checkAndTargeting(targetingGroup.targetings, visitor)
    );
  }

  private isANDListOperator(operator: string): boolean {
    return ['NOT_EQUALS', 'NOT_CONTAINS'].includes(operator);
  }

  private checkAndTargeting(targetings: Targetings[], visitor: VisitorAbstract): boolean {
    let contextValue: primitive;
    let check = false;

    for (const { key, value, operator } of targetings) {
      if (operator === 'EXISTS') {
        if (key in visitor.context) {
          check = true;
          continue;
        }
        check = false;
        break;
      }

      if (operator === 'NOT_EXISTS') {
        if (key in visitor.context) {
          check = false;
          break;
        }
        check = true;
        continue;
      }

      if (key === 'fs_all_users') {
        check = true;
        continue;
      }
      if (key === 'fs_users') {
        contextValue = visitor.visitorId;
      } else {
        if (!(key in visitor.context)) {
          check = false;
          break;
        }
        contextValue = visitor.context[key];
      }

      check = this.testOperator(operator, contextValue, value);

      if (!check) {
        break;
      }
    }
    return check;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private testListOperatorLoop(operator: string, contextValue: primitive, value: any[], initialCheck: boolean):boolean {
    let check = initialCheck;
    for (const v of value) {
      check = this.testOperator(operator, contextValue, v);
      if (check !== initialCheck) {
        break;
      }
    }
    return check;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private testListOperator(operator: string, contextValue: primitive, value: any[]): boolean {
    const andOperator = this.isANDListOperator(operator);
    if (andOperator) {
      return this.testListOperatorLoop(operator, contextValue, value, true);
    }
    return this.testListOperatorLoop(operator, contextValue, value, false);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private testOperator(operator: string, contextValue: primitive, value: any): boolean {
    let check: boolean;
    if (Array.isArray(value)) {

      return this.testListOperator(operator, contextValue, value);
    }
    switch (operator) {
      case 'EQUALS':
        check = contextValue === value;
        break;
      case 'NOT_EQUALS':
        check = contextValue !== value;
        break;
      case 'CONTAINS':
        check = contextValue.toString().includes(value.toString());
        break;
      case 'NOT_CONTAINS':
        check = !contextValue.toString().includes(value.toString());
        break;
      case 'GREATER_THAN':
        check = contextValue > value;
        break;
      case 'LOWER_THAN':
        check = contextValue < value;
        break;
      case 'GREATER_THAN_OR_EQUALS':
        check = contextValue >= value;
        break;
      case 'LOWER_THAN_OR_EQUALS':
        check = contextValue <= value;
        break;
      case 'STARTS_WITH':
        check = contextValue.toString().startsWith(value.toString());
        break;
      case 'ENDS_WITH':
        check = contextValue.toString().endsWith(value.toString());
        break;
      default:
        check = false;
        break;
    }

    return check;
  }
}
