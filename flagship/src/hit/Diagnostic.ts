import { IFlagshipConfig } from '../config/index';
import { CacheStrategy, FSSdkStatus, LogLevel } from '../enum/index';
import { CUSTOMER_ENV_ID_API_ITEM,
  DS_API_ITEM,
  SDK_APP,
  SDK_INFO,
  T_API_ITEM,
  VISITOR_ID_API_ITEM } from '../enum/FlagshipConstant';
import { HitAbstract, IHitAbstract } from './HitAbstract';
import { BucketingDTO } from '../decision/api/bucketingDTO';
import { AccountSettings, EAIScore, FlagDTO, SerializedFlagMetadata, TroubleshootingLabel, primitive } from '../types';
import { CampaignDTO } from '../mod';
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy';

export const ERROR_MESSAGE = 'event category and event action are required';

export interface IDiagnostic extends IHitAbstract{
    version?: string
    logLevel: LogLevel
    accountId?:string
    envId?:string
    timestamp?:string
    timeZone?: string
    label: TroubleshootingLabel
    lastInitializationTimestamp?: string
    lastBucketingTimestamp?: string

    stackType?: string
    stackName?: string
    stackVersion?: string
    stackOriginName?: string
    stackOriginVersion?: string

    sdkStatus?: FSSdkStatus
    sdkConfigMode?: string
    sdkConfigLogLevel?:LogLevel
    sdkConfigCustomLogManager?: boolean
    sdkConfigCustomCacheManager?: boolean
    sdkConfigStatusListener?: boolean
    sdkConfigTimeout?: number
    sdkConfigPollingInterval?: number
    sdkConfigFetchNow?: boolean
    sdkConfigReuseVisitorIds?: boolean
    sdkConfigInitialBucketing?:BucketingDTO
    sdkConfigDecisionApiUrl?: string
    sdkConfigHitDeduplicationTime?: number
    sdkConfigTrackingManagerStrategy?: CacheStrategy
    sdkConfigTrackingManagerBatchIntervals?: number
    sdkConfigTrackingManagerPoolMaxSize?: number
    sdkBucketingFile?: BucketingDTO
    sdkConfigUsingCustomHitCache?: boolean
    sdkConfigUsingCustomVisitorCache?: boolean
    sdkConfigUsingOnVisitorExposed?: boolean
    sdkConfigFetchThirdPartyData?:boolean
    sdkConfigFetchFlagsBufferingTime?:number
    sdkConfigNextFetchConfig?:Record<string, unknown>
    sdkConfigDisableDeveloperUsageTracking?:boolean
    sdkConfigDisableCache?:boolean

    httpRequestUrl?:string
    httpRequestMethod?:string
    httpRequestHeaders?:Record<string, unknown>
    httpRequestBody?:unknown

    httpResponseUrl?:string
    httpResponseMethod?: string
    httpResponseHeaders?: Record<string, unknown>
    httpResponseCode?: number
    httpResponseBody?: unknown
    httpResponseTime?:number

    visitorStatus?: string
    visitorInstanceType?: string
    visitorContext?: Record<string, primitive>
    visitorConsent?: boolean
    visitorAssignmentHistory?: Record<string, string>
    visitorFlags?: Map<string, FlagDTO>
    visitorCampaigns?: CampaignDTO[] | null
    visitorCampaignFromCache?: CampaignDTO[] | null
    visitorIsAuthenticated?:boolean
    visitorInitialCampaigns?:CampaignDTO[]
    visitorInitialFlagsData? : SerializedFlagMetadata[]

    contextKey?:string
    contextValue?: unknown

    flagKey?: string
    flagValue?: string
    flagDefault?: unknown
    visitorExposed?: boolean

    flagMetadataCampaignId?:string
    flagMetadataCampaignName?:string
    flagMetadataVariationGroupId?: string
    flagMetadataVariationGroupName?: string
    flagMetadataVariationId?: string
    flagMetadataVariationName?: string
    flagMetadataCampaignSlug?: string|null
    flagMetadataCampaignType?: string
    flagMetadataCampaignIsReference?: boolean

    hitContent?: Record<string, unknown>
    batchTriggeredBy?: BatchTriggeredBy

    visitorSessionId?:string
    traffic?: number
    flagshipInstanceId?:string

    accountSettings? : AccountSettings

    eAIScore?: EAIScore
    isEAIScoreFromLocalCache?: boolean
    eAIDataTimestamp?: string

  }

/**
 * Represents a diagnostic hit.
 */
export abstract class Diagnostic extends HitAbstract {
  public data: Omit<IDiagnostic & {config: IFlagshipConfig},
  'createdAt'|'category'>;

  private _traffic?: number;
  public get traffic() : number|undefined {
    return this._traffic;
  }

  public set traffic(v : number|undefined) {
    this._traffic = v;
  }

  public constructor(param:Omit<IDiagnostic & {config: IFlagshipConfig},
        'createdAt'|'category'>) {
    super({
      type: param.type,
      userIp: param.userIp,
      screenResolution: param.screenResolution,
      locale: param.locale,
      sessionNumber: param.sessionNumber,
      visitorId: param.visitorId,
      anonymousId: param.anonymousId
    });

    this.data = {
      ...param,
      version: param.version || '1',
      stackType: param.stackType || 'SDK',
      stackName: param.stackName || SDK_INFO.name,
      stackVersion: param.stackVersion || SDK_INFO.version,
      label: param.label,
      logLevel: param.logLevel,
      timestamp: param.timestamp || new Date(Date.now()).toISOString(),
      timeZone: this.getTimezone(),
      ds: SDK_APP,
      envId: param.envId || param.config.envId
    };
    this._traffic = param.traffic;
    this.config = param.config;
  }

  /**
   * Gets the timezone of the user.
   * @returns The timezone as a string. If the timezone cannot be determined, it returns the offset from UTC in hours.
   */
  public getTimezone(): string {
    const timezone = typeof Intl === 'object' ? Intl.DateTimeFormat()?.resolvedOptions()?.timeZone : undefined;
    return timezone || `${new Date().getTimezoneOffset() / 60}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, complexity
  public toApiKeys(): any {
    const apiKeys:Record<string, unknown> = {
      [VISITOR_ID_API_ITEM]: this.visitorId,
      [DS_API_ITEM]: this.data.ds,
      [CUSTOMER_ENV_ID_API_ITEM]: `${this.data.config?.envId}`,
      [T_API_ITEM]: this.type,
      cv: {}
    };
    const customVariable:Record<string, unknown> = {
      version: `${this.data.version}`,
      logLevel: `${LogLevel[this.data.logLevel]}`,
      timestamp: `${this.data.timestamp}`,
      timeZone: `${this.data.timeZone}`,
      label: `${this.data.label}`,
      'stack.type': `${this.data.stackType}`,
      'stack.name': `${this.data.stackName}`,
      'stack.version': `${this.data.stackVersion}`
    };

    if (this.data.lastBucketingTimestamp !== undefined) {
      customVariable.lastBucketingTimestamp = `${this.data.lastBucketingTimestamp}`;
    }

    if (this.data.lastInitializationTimestamp !== undefined) {
      customVariable.lastInitializationTimestamp = `${this.data.lastInitializationTimestamp}`;
    }

    if (this.data.flagshipInstanceId !== undefined) {
      customVariable.flagshipInstanceId = `${this.data.flagshipInstanceId}`;
    }

    if (this.data.accountId) {
      customVariable.accountId = `${this.data.accountId}`;
    }

    if (this.data.envId) {
      customVariable.envId = `${this.data.envId}`;
    }

    if (this.data.sdkBucketingFile !== undefined) {
      customVariable.sdkBucketingFile = JSON.stringify(this.data.sdkBucketingFile);
    }

    if (this.data.stackOriginName !== undefined) {
      customVariable['stack.origin.name'] = `${this.data.stackOriginName}`;
    }
    if (this.data.stackOriginVersion !== undefined) {
      customVariable['stack.origin.version'] = `${this.data.stackOriginVersion}`;
    }
    if (this.data.sdkStatus !== undefined) {
      customVariable['sdk.status'] = `${FSSdkStatus[this.data.sdkStatus]}`;
    }
    if (this.data.sdkConfigLogLevel !== undefined) {
      customVariable['sdk.config.logLevel'] = `${LogLevel[this.data.sdkConfigLogLevel]}`;
    }
    if (this.data.sdkConfigMode !== undefined) {
      customVariable['sdk.config.mode'] = `${this.data.sdkConfigMode}`;
    }
    if (this.data.sdkConfigCustomLogManager !== undefined) {
      customVariable['sdk.config.customLogManager'] = `${this.data.sdkConfigCustomLogManager}`;
    }
    if (this.data.sdkConfigCustomCacheManager !== undefined) {
      customVariable['sdk.config.customCacheManager'] = `${this.data.sdkConfigCustomCacheManager}`;
    }
    if (this.data.sdkConfigStatusListener !== undefined) {
      customVariable['sdk.config.custom.StatusListener'] = `${this.data.sdkConfigStatusListener}`;
    }
    if (this.data.sdkConfigTimeout !== undefined) {
      customVariable['sdk.config.timeout'] = `${this.data.sdkConfigTimeout * 1000}`;
    }
    if (this.data.sdkConfigPollingInterval !== undefined) {
      customVariable['sdk.config.pollingTime'] = `${this.data.sdkConfigPollingInterval * 1000}`;
    }
    if (this.data.sdkConfigTrackingManagerStrategy !== undefined) {
      customVariable['sdk.config.trackingManager.strategy'] = `${CacheStrategy[this.data.sdkConfigTrackingManagerStrategy]}`;
    }
    if (this.data.sdkConfigTrackingManagerBatchIntervals !== undefined) {
      customVariable['sdk.config.trackingManager.batchIntervals'] = `${this.data.sdkConfigTrackingManagerBatchIntervals * 1000}`;
    }
    if (this.data.sdkConfigTrackingManagerPoolMaxSize !== undefined) {
      customVariable['sdk.config.trackingManager.poolMaxSize'] = `${this.data.sdkConfigTrackingManagerPoolMaxSize}`;
    }
    if (this.data.sdkConfigFetchNow !== undefined) {
      customVariable['sdk.config.fetchNow'] = `${this.data.sdkConfigFetchNow}`;
    }
    if (this.data.sdkConfigReuseVisitorIds !== undefined) {
      customVariable['sdk.config.reuseVisitorIds'] = `${this.data.sdkConfigReuseVisitorIds}`;
    }
    if (this.data.sdkConfigInitialBucketing !== undefined) {
      customVariable['sdk.config.initialBucketing'] = JSON.stringify(this.data.sdkConfigInitialBucketing);
    }
    if (this.data.sdkConfigDecisionApiUrl !== undefined) {
      customVariable['sdk.config.decisionApiUrl'] = `${this.data.sdkConfigDecisionApiUrl}`;
    }
    if (this.data.sdkConfigHitDeduplicationTime !== undefined) {
      customVariable['sdk.config.hitDeduplicationTime'] = `${this.data.sdkConfigHitDeduplicationTime * 1000}`;
    }
    if (this.data.sdkConfigUsingCustomHitCache !== undefined) {
      customVariable['sdk.config.usingCustomHitCache'] = JSON.stringify(this.data.sdkConfigUsingCustomHitCache);
    }
    if (this.data.sdkConfigUsingCustomVisitorCache !== undefined) {
      customVariable['sdk.config.usingCustomVisitorCache'] = JSON.stringify(this.data.sdkConfigUsingCustomVisitorCache);
    }
    if (this.data.sdkConfigUsingOnVisitorExposed !== undefined) {
      customVariable['sdk.config.usingOnVisitorExposed'] = JSON.stringify(this.data.sdkConfigUsingOnVisitorExposed);
    }
    if (this.data.sdkConfigFetchThirdPartyData !== undefined) {
      customVariable['sdk.config.fetchThirdPartyData'] = JSON.stringify(this.data.sdkConfigFetchThirdPartyData);
    }
    if (this.data.sdkConfigFetchFlagsBufferingTime !== undefined) {
      customVariable['sdk.config.fetchFlagsBufferingTime'] = JSON.stringify(this.data.sdkConfigFetchFlagsBufferingTime * 1000);
    }
    if (this.data.sdkConfigNextFetchConfig !== undefined) {
      customVariable['sdk.config.nextFetchConfig'] = JSON.stringify(this.data.sdkConfigNextFetchConfig);
    }
    if (this.data.sdkConfigDisableDeveloperUsageTracking !== undefined) {
      customVariable['sdk.config.disableDeveloperUsageTracking'] = JSON.stringify(this.data.sdkConfigDisableDeveloperUsageTracking);
    }
    if (this.data.sdkConfigDisableCache !== undefined) {
      customVariable['sdk.config.disableCache'] = JSON.stringify(this.data.sdkConfigDisableCache);
    }
    if (this.data.httpRequestUrl !== undefined) {
      customVariable['http.request.url'] = `${this.data.httpRequestUrl}`;
    }
    if (this.data.httpRequestMethod !== undefined) {
      customVariable['http.request.method'] = `${this.data.httpRequestMethod}`;
    }
    if (this.data.httpRequestHeaders !== undefined) {
      customVariable['http.request.headers'] = JSON.stringify(this.data.httpRequestHeaders);
    }
    if (this.data.httpRequestBody !== undefined) {
      customVariable['http.request.body'] = JSON.stringify(this.data.httpRequestBody);
    }
    if (this.data.httpResponseUrl !== undefined) {
      customVariable['http.response.url'] = `${this.data.httpResponseUrl}`;
    }
    if (this.data.httpResponseMethod !== undefined) {
      customVariable['http.response.method'] = `${this.data.httpResponseMethod}`;
    }
    if (this.data.httpResponseHeaders !== undefined) {
      customVariable['http.response.headers'] = JSON.stringify(this.data.httpResponseHeaders);
    }
    if (this.data.httpResponseCode !== undefined) {
      customVariable['http.response.code'] = `${this.data.httpResponseCode}`;
    }
    if (this.data.httpResponseBody !== undefined) {
      customVariable['http.response.body'] = JSON.stringify(this.data.httpResponseBody);
    }
    if (this.data.httpResponseTime !== undefined) {
      customVariable['http.response.time'] = `${this.data.httpResponseTime}`;
    }

    if (this.visitorId !== undefined) {
      customVariable['visitor.visitorId'] = `${this.visitorId}`;
    }

    if (this.anonymousId !== undefined) {
      customVariable['visitor.anonymousId'] = `${this.anonymousId}`;
    }

    if (this.data.visitorSessionId !== undefined) {
      customVariable['visitor.sessionId'] = `${this.data.visitorSessionId}`;
    }
    if (this.data.visitorStatus !== undefined) {
      customVariable['visitor.status'] = `${this.data.visitorStatus}`;
    }
    if (this.data.visitorInstanceType !== undefined) {
      customVariable['visitor.instanceType'] = `${this.data.visitorInstanceType}`;
    }
    if (this.data.visitorContext !== undefined) {
      for (const key in this.data.visitorContext) {
        const element = this.data.visitorContext[key];
        customVariable[`visitor.context.[${key}]`] = `${element}`;
      }
    }
    if (this.data.visitorConsent !== undefined) {
      customVariable['visitor.consent'] = `${this.data.visitorConsent}`;
    }
    if (this.data.visitorAssignmentHistory !== undefined) {
      for (const key in this.data.visitorAssignmentHistory) {
        const element = this.data.visitorAssignmentHistory[key];
        customVariable[`visitor.assignments.[${key}]`] = element;
      }
    }
    if (this.data.visitorFlags !== undefined) {
      this.data.visitorFlags.forEach((item, flagKey) => {
        for (const itemKey in item) {
          const itemValue = item[itemKey as keyof typeof item];
          const hasMetadataKey = itemKey === 'value' || itemKey === 'key';
          const value = typeof itemValue === 'string' ? itemValue : JSON.stringify(itemValue);
          customVariable[`visitor.flags.[${flagKey}]${hasMetadataKey ? '' : '.metadata'}.${itemKey}`] = value;
        }
      });
    }

    if (this.data.visitorIsAuthenticated !== undefined) {
      customVariable['visitor.isAuthenticated'] = `${this.data.visitorIsAuthenticated}`;
    }

    if (this.data.visitorInitialCampaigns !== undefined) {
      customVariable['visitor.initialCampaigns'] = JSON.stringify(this.data.visitorInitialCampaigns);
    }

    if (this.data.visitorInitialFlagsData !== undefined) {
      customVariable['visitor.initialFlagsData'] = JSON.stringify(Array.isArray(this.data.visitorInitialFlagsData) ? this.data.visitorInitialFlagsData : Array.from(this.data.visitorInitialFlagsData));
    }

    if (this.data.visitorCampaigns !== undefined) {
      customVariable['visitor.campaigns'] = JSON.stringify(this.data.visitorCampaigns);
    }

    if (this.data.visitorCampaignFromCache !== undefined) {
      customVariable['visitor.campaignFromCache'] = JSON.stringify(this.data.visitorCampaignFromCache);
    }

    if (this.data.contextKey !== undefined) {
      customVariable.contextKey = `${this.data.contextKey}`;
    }

    if (this.data.contextValue !== undefined) {
      customVariable.contextValue = `${this.data.contextValue}`;
    }

    if (this.data.flagKey !== undefined) {
      customVariable['flag.key'] = `${this.data.flagKey}`;
    }
    if (this.data.flagValue !== undefined) {
      customVariable['flag.value'] = `${this.data.flagValue}`;
    }
    if (this.data.flagDefault !== undefined) {
      customVariable['flag.default'] = JSON.stringify(this.data.flagDefault);
    }
    if (this.data.flagMetadataCampaignId !== undefined) {
      customVariable['flag.metadata.campaignId'] = `${this.data.flagMetadataCampaignId}`;
    }
    if (this.data.flagMetadataCampaignName !== undefined) {
      customVariable['flag.metadata.campaignName'] = `${this.data.flagMetadataCampaignName}`;
    }
    if (this.data.flagMetadataVariationGroupId !== undefined) {
      customVariable['flag.metadata.variationGroupId'] = `${this.data.flagMetadataVariationGroupId}`;
    }
    if (this.data.flagMetadataVariationGroupName !== undefined) {
      customVariable['flag.metadata.variationGroupName'] = `${this.data.flagMetadataVariationGroupName}`;
    }
    if (this.data.flagMetadataVariationId !== undefined) {
      customVariable['flag.metadata.variationId'] = `${this.data.flagMetadataVariationId}`;
    }
    if (this.data.flagMetadataVariationName !== undefined) {
      customVariable['flag.metadata.variationName'] = `${this.data.flagMetadataVariationName}`;
    }
    if (this.data.flagMetadataCampaignSlug !== undefined) {
      customVariable['flag.metadata.campaignSlug'] = `${this.data.flagMetadataCampaignSlug}`;
    }
    if (this.data.flagMetadataCampaignType !== undefined) {
      customVariable['flag.metadata.campaignType'] = `${this.data.flagMetadataCampaignType}`;
    }
    if (this.data.flagMetadataCampaignIsReference !== undefined) {
      customVariable['flag.metadata.isReference'] = `${this.data.flagMetadataCampaignIsReference}`;
    }

    if (this.data.hitContent !== undefined) {
      for (const key in this.data.hitContent) {
        const element = this.data.hitContent[key];
        customVariable[`hit.${key}`] = typeof element === 'string' ? element : JSON.stringify(element);
      }
    }
    if (this.data.batchTriggeredBy !== undefined) {
      customVariable.batchTriggeredBy = `${BatchTriggeredBy[this.data.batchTriggeredBy]}`;
    }

    if (this.data.accountSettings !== undefined) {
      for (const key in this.data.accountSettings) {
        const element = this.data.accountSettings[key as keyof AccountSettings];
        customVariable[`accountSettings.${key}`] = typeof element === 'string' ? element : JSON.stringify(element);
      }
    }

    if (this.data.eAIScore !== undefined) {
      customVariable['eAIScore.eai.eas'] = this.data.eAIScore.eai.eas;
    }

    if (this.data.isEAIScoreFromLocalCache !== undefined) {
      customVariable.isEAIScoreFromLocalCache = `${this.data.isEAIScoreFromLocalCache}`;
    }

    if (this.data.eAIDataTimestamp !== undefined) {
      customVariable.eAIDataTimestamp = `${this.data.eAIDataTimestamp}`;
    }

    apiKeys.cv = customVariable;
    return apiKeys;
  }

  public isReady(checkParent = true): boolean {
    return !!((!checkParent || super.isReady()));
  }

  public getErrorMessage(): string {
    return ERROR_MESSAGE;
  }
}
