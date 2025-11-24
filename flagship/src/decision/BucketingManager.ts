import { ALLOCATION, BUCKETING_NEW_ALLOCATION, BUCKETING_VARIATION_CACHE, GET_THIRD_PARTY_SEGMENT, THIRD_PARTY_SEGMENT_URL } from '../enum/FlagshipConstant';
import { IFlagshipConfig } from '../config/index';
import { LogLevel } from '../enum/index';
import { BucketingDTO, CampaignDTO, TargetingOperator, Targetings, ThirdPartySegment, TroubleshootingLabel, VariationDTO, VariationGroupDTO, primitive } from '../types';
import { IHttpClient } from '../utils/HttpClient';
import { MurmurHash } from '../utils/MurmurHash';
import { errorFormat, logDebugSprintf, logError, sprintf } from '../utils/utils';
import { VisitorAbstract } from '../visitor/VisitorAbstract';
import { DecisionManager } from './DecisionManager';
import { ISdkManager } from '../main/ISdkManager';
import { ITrackingManager } from '../api/ITrackingManager.ts';
import { Segment } from '../hit/Segment.ts';
import { Troubleshooting } from '../hit/Troubleshooting.ts';

type ConstructorParam = {
  httpClient: IHttpClient;
  config: IFlagshipConfig;
  murmurHash: MurmurHash;
  sdkManager: ISdkManager;
  trackingManager: ITrackingManager;
  flagshipInstanceId?: string;
}
export class BucketingManager extends DecisionManager {
  private _murmurHash: MurmurHash;
  private _sdkManager: ISdkManager;

  private get _bucketingContent(): BucketingDTO | undefined {
    return this._sdkManager.getBucketingContent();
  }

  public constructor({ httpClient, config, murmurHash, sdkManager, trackingManager, flagshipInstanceId }: ConstructorParam) {
    super({
      httpClient,
      config,
      trackingManager,
      flagshipInstanceId
    });
    this._murmurHash = murmurHash;
    this._sdkManager = sdkManager;
  }

  private async sendContext(visitor: VisitorAbstract): Promise<void> {
    try {
      if (Object.keys(visitor.context).length <= 3 || !visitor.hasConsented || !visitor.hasContextBeenUpdated) {
        return;
      }

      visitor.hasContextBeenUpdated = false;
      const SegmentHit = new Segment({
        context: visitor.context,
        visitorId: visitor.visitorId,
        anonymousId: visitor.anonymousId as string
      });

      await visitor.sendHit(SegmentHit);

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

    let visitorCampaigns: CampaignDTO[] = [];

    this._bucketingContent.campaigns.forEach(campaign => {
      const currentCampaigns = this.getVisitorCampaigns(campaign.variationGroups, campaign.id, campaign.type, visitor);
      if (currentCampaigns) {
        currentCampaigns.slug = campaign.slug ?? null;
        currentCampaigns.name = campaign.name;
        visitorCampaigns.push(currentCampaigns);
      }
    });

    visitorCampaigns = this.applyCampaignsForcedAllocation(visitor, visitorCampaigns);
    visitorCampaigns = this.applyCampaignsForcedUnallocation(visitor, visitorCampaigns);

    return visitorCampaigns;
  }

  private getVisitorCampaigns(variationGroups: VariationGroupDTO[], campaignId: string, campaignType: string, visitor: VisitorAbstract): CampaignDTO | null {
    for (const variationGroup of variationGroups) {
      const check = this.checkVisitorMatchesTargeting(variationGroup, visitor);
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

  private checkVisitorMatchesTargeting(variationGroup: VariationGroupDTO, visitor: VisitorAbstract): boolean {
    if (!variationGroup || !variationGroup.targeting || !variationGroup.targeting.targetingGroups) {
      return false;
    }
    // OR logic: visitor matches if ANY targeting group matches
    return variationGroup.targeting.targetingGroups.some(
      targetingGroup => this.checkAllTargetingRulesMatch(targetingGroup.targetings, visitor)
    );
  }


  private checkAllTargetingRulesMatch(targetings: Targetings[], visitor: VisitorAbstract): boolean {
    if (!targetings || targetings.length === 0) {
      return false;
    }
    // AND logic: ALL targeting rules must match
    return targetings.every(targeting =>
      this.matchesTargetingCriteria(targeting, visitor)
    );
  }


  private matchesArrayTargeting(targeting: Targetings, visitorData: VisitorAbstract): boolean {
    if (!Array.isArray(targeting.value)) {
      return false;
    }

    const notOperator = [TargetingOperator.NOT_EQUALS, TargetingOperator.NOT_CONTAINS].includes(targeting.operator);

    return notOperator
      ? targeting.value.every((val) => this.matchesTargetingCriteria({
        ...targeting,
        value: val
      }, visitorData))
      : targeting.value.some((val) => this.matchesTargetingCriteria({
        ...targeting,
        value: val
      }, visitorData));
  }

  private matchesTargetingCriteria(targeting: Targetings, visitor: VisitorAbstract): boolean {
    if (targeting.key === 'fs_all_users') {
      return true;
    }
    if (Array.isArray(targeting.value)) {
      return this.matchesArrayTargeting(targeting, visitor);
    }

    const visitorValue = targeting.key === 'fs_users'
      ? visitor.visitorId
      : visitor.context[targeting.key];

    if (visitorValue === undefined || visitorValue === null) {
      return targeting.operator === TargetingOperator.NOT_EXISTS;
    }

    return this.evaluateOperator(targeting.operator, visitorValue, targeting.value);
  }


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private evaluateOperator(operator: TargetingOperator, visitorValue: primitive, targetValue: any): boolean {
    switch (operator) {
      case TargetingOperator.EQUALS:
        return visitorValue === targetValue;

      case TargetingOperator.NOT_EQUALS:
        return visitorValue !== targetValue;

      case TargetingOperator.CONTAINS:
        return visitorValue.toString().includes(targetValue.toString());

      case TargetingOperator.NOT_CONTAINS:
        return !visitorValue.toString().includes(targetValue.toString());

      case TargetingOperator.EXISTS:
        return true;

      case TargetingOperator.NOT_EXISTS:
        return false;

      case TargetingOperator.GREATER_THAN:
        return visitorValue > targetValue;

      case TargetingOperator.LOWER_THAN:
        return visitorValue < targetValue;

      case TargetingOperator.GREATER_THAN_OR_EQUALS:
        return visitorValue >= targetValue;

      case TargetingOperator.LOWER_THAN_OR_EQUALS:
        return visitorValue <= targetValue;

      case TargetingOperator.STARTS_WITH:
        return visitorValue.toString().startsWith(targetValue.toString());

      case TargetingOperator.ENDS_WITH:
        return visitorValue.toString().endsWith(targetValue.toString());

      default:
        return false;
    }
  }
}
