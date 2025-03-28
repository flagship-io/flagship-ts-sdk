import { Page } from './../../src/hit/Page'
import { jest, expect, it, describe, afterAll } from '@jest/globals'
import { ERROR_MESSAGE } from '../../src/hit/Event'
import { BucketingConfig } from '../../src/config/index'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  CacheStrategy,
  DS_API_ITEM,
  FSSdkStatus,
  LogLevel,
  SDK_APP,
  SDK_INFO,
  T_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../../src/enum/index'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { version } from '../../src/sdkVersion'
import { Troubleshooting, TroubleshootingType } from '../../src/hit/Troubleshooting'
import { BatchTriggeredBy } from '../../src/enum/BatchTriggeredBy'
import { FlagDTO, TroubleshootingLabel } from '../../src/types'

describe('test hit type Monitoring', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  const visitorId = 'visitorId'
  Date.now = mockNow
  mockNow.mockReturnValue(1657899294744)
  afterAll(() => {
    Date.now = methodNow
  })

  // .mockImplementation(() => OriginalDate as any)
  const logManager = new FlagshipLogManager()
  const config = new BucketingConfig({ envId: 'envId', apiKey: 'apiKey', pollingInterval: 2, initialBucketing: {} })
  config.logManager = logManager
  const logLevel = LogLevel.INFO
  const logVersion = '1'
  const label = TroubleshootingLabel.VISITOR_FETCH_CAMPAIGNS
  const stackType = 'SDK'
  const troubleshooting = new Troubleshooting({ visitorId, logLevel, config, label })
  const timestamp = new Date(1657899294744)
  it('should ', () => {
    const apiKeys: Record<string, unknown> = {
      [VISITOR_ID_API_ITEM]: visitorId,
      [DS_API_ITEM]: SDK_APP,
      [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
      [T_API_ITEM]: 'TROUBLESHOOTING',
      cv: {
        version: `${logVersion}`,
        logLevel: `${LogLevel[logLevel]}`,
        envId: `${config.envId}`,
        timestamp: `${timestamp.toISOString()}`,
        label,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        'stack.type': 'SDK',
        'stack.name': `${SDK_INFO.name}`,
        'stack.version': `${version}`,
        'visitor.visitorId': visitorId,
        'visitor.anonymousId': 'null'
      }
    }

    expect(troubleshooting.ds).toBe(SDK_APP)
    expect(troubleshooting.data.logLevel).toBe(logLevel)
    expect(troubleshooting.data.stackType).toBe(stackType)
    expect(troubleshooting.visitorId).toBe(visitorId)
    expect(troubleshooting.anonymousId).toBeNull()
    expect(troubleshooting.getErrorMessage()).toBe(ERROR_MESSAGE)
    expect(troubleshooting.userIp).toBeUndefined()
    expect(troubleshooting.screenResolution).toBeUndefined()
    expect(troubleshooting.locale).toBeUndefined()
    expect(troubleshooting.sessionNumber).toBeUndefined()
    expect(troubleshooting.toApiKeys()).toEqual(apiKeys)
  })

  it('test constructor', () => {
    const flagKey = 'key'
    const flagDTO = {
      key: flagKey,
      campaignId: 'campaignId',
      campaignName: 'campaignName',
      variationGroupId: 'variationGroupId',
      variationGroupName: 'variationGroupName',
      variationId: 'variationId',
      variationName: 'variationName',
      isReference: false,
      campaignType: 'ab',
      slug: 'slug',
      value: 'value'
    }
    const visitorFlags:Record<string, unknown> = {}

    for (const key in flagDTO) {
      const itemValue = flagDTO[key as keyof typeof flagDTO]
      const hasMetadataKey = key === 'value' || key === 'key'
      const value = typeof itemValue === 'object' ? JSON.stringify(itemValue) : `${itemValue}`
      visitorFlags[`visitor.flags.[${flagKey}]${hasMetadataKey ? '' : '.metadata'}.${key}`] = value
    }

    const hitContent = new Page({ documentLocation: 'localhost', visitorId })

    const eAIScore = {
      eai: {
        eas: 'score'
      }
    }

    const params:TroubleshootingType = {
      logLevel,
      accountId: 'accountId',
      envId: config.envId,
      label,
      stackType: 'SDK',
      stackName: SDK_INFO.name,
      stackVersion: version,
      stackOriginName: 'this.stackOriginName',
      stackOriginVersion: 'this.stackOriginVersion',
      sdkStatus: FSSdkStatus.SDK_INITIALIZED,
      sdkConfigMode: 'this.sdkConfigMode',
      sdkConfigCustomLogManager: true,
      sdkConfigCustomCacheManager: false,
      sdkConfigStatusListener: false,
      sdkConfigTimeout: config.timeout,
      sdkConfigPollingInterval: config.pollingInterval,
      sdkConfigTrackingManagerStrategy: config.trackingManagerConfig.cacheStrategy,
      sdkConfigTrackingManagerBatchIntervals: config.trackingManagerConfig.batchIntervals,
      sdkConfigTrackingManagerPoolMaxSize: config.trackingManagerConfig.poolMaxSize,
      sdkConfigFetchNow: config.fetchNow,
      sdkConfigReuseVisitorIds: config.reuseVisitorIds,
      sdkConfigInitialBucketing: config.initialBucketing,
      sdkConfigDecisionApiUrl: config.decisionApiUrl,
      sdkConfigHitDeduplicationTime: config.hitDeduplicationTime,
      sdkConfigUsingCustomHitCache: true,
      sdkConfigUsingCustomVisitorCache: false,
      sdkConfigUsingOnVisitorExposed: false,
      sdkConfigFetchThirdPartyData: true,
      sdkConfigFetchFlagsBufferingTime: 10,
      sdkConfigDisableDeveloperUsageTracking: false,
      sdkConfigNextFetchConfig: { key: 'value' },
      sdkConfigDisableCache: false,

      httpRequestUrl: 'this.httpRequestUrl',
      httpRequestMethod: 'this.httpRequestMethod',
      httpRequestHeaders: { key: 'value' },
      httpRequestBody: 'this.httpRequestBody',
      httpResponseUrl: 'this.httpResponseUrl',
      httpResponseMethod: 'this.httpResponseMethod',
      httpResponseHeaders: { key: 'value' },
      httpResponseCode: 200,
      httpResponseBody: 'this.httpResponseBody',
      httpResponseTime: 2,

      visitorStatus: 'this.visitorStatus',
      visitorInstanceType: 'this.visitorInstanceType',
      visitorContext: { key: 'value' },
      visitorConsent: true,
      visitorAssignmentHistory: { key: 'value' },
      visitorFlags: new Map<string, FlagDTO>().set(flagDTO.key, flagDTO),
      visitorIsAuthenticated: false,
      visitorInitialCampaigns: [],
      visitorInitialFlagsData: [],
      visitorCampaigns: [],
      visitorCampaignFromCache: [],

      flagKey: 'this.flagKey',
      flagValue: 'this.flagValue',
      flagDefault: 'this.flagDefault',
      flagMetadataCampaignId: 'this.flagMetadataCampaignId',
      flagMetadataCampaignName: 'flagMetadataCampaignName',
      flagMetadataVariationGroupId: 'this.flagMetadataVariationGroupId',
      flagMetadataVariationGroupName: 'flagMetadataVariationGroupName',
      flagMetadataVariationId: 'this.flagMetadataVariationId',
      flagMetadataVariationName: 'flagMetadataVariationName',
      flagMetadataCampaignSlug: 'this.flagMetadataCampaignSlug',
      flagMetadataCampaignType: 'this.flagMetadataCampaignType',
      flagMetadataCampaignIsReference: true,
      visitorId,
      config,
      lastBucketingTimestamp: '2023/01/01',
      lastInitializationTimestamp: '2023/01/01',
      flagshipInstanceId: 'flagshipInstanceId',
      visitorSessionId: 'visitorInstanceId',
      sdkBucketingFile: {},
      contextKey: 'key',
      contextValue: 'value',
      hitContent: hitContent.toApiKeys(),
      batchTriggeredBy: BatchTriggeredBy.ActivateLength,

      accountSettings: {
        eaiActivationEnabled: true,
        eaiCollectEnabled: true
      },
      eAIScore,
      isEAIScoreFromLocalCache: true,
      eAIDataTimestamp: '2023/01/01'
    }

    const pageHit:Record<string, unknown> = {}
    for (const key in params.hitContent) {
      const element = params.hitContent[key]
      pageHit[`hit.${key}`] = typeof element === 'string' ? element : JSON.stringify(element)
    }

     
    const getCustomVariable = () => {
      return {
        version: `${logVersion}`,
        logLevel: `${LogLevel[logLevel]}`,
        accountId: params.accountId,
        envId: `${config.envId}`,
        timestamp: `${new Date(1657899294744).toISOString()}`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        label,
        'stack.type': 'SDK',
        'stack.name': `${SDK_INFO.name}`,
        'stack.version': `${version}`,
        'stack.origin.name': params.stackOriginName,
        'stack.origin.version': params.stackOriginVersion,
        'sdk.status': `${FSSdkStatus[params.sdkStatus as number]}`,
        'sdk.config.mode': params.sdkConfigMode,
        'sdk.config.customLogManager': `${params.sdkConfigCustomLogManager}`,
        'sdk.config.customCacheManager': `${params.sdkConfigCustomCacheManager}`,
        'sdk.config.custom.StatusListener': `${params.sdkConfigStatusListener}`,
        'sdk.config.timeout': `${config.timeout * 1000}`,
        'sdk.config.pollingTime': `${config.pollingInterval * 1000}`,
        'sdk.config.decisionApiUrl': `${params.sdkConfigDecisionApiUrl}`,
        'sdk.config.hitDeduplicationTime': `${config.hitDeduplicationTime * 1000}`,
        'sdk.config.reuseVisitorIds': `${params.sdkConfigReuseVisitorIds}`,
        'sdk.config.fetchNow': `${params.sdkConfigFetchNow}`,
        'sdk.config.initialBucketing': JSON.stringify(params.sdkConfigInitialBucketing),
        'sdk.config.trackingManager.strategy': `${CacheStrategy[params.sdkConfigTrackingManagerStrategy as number]}`,
        'sdk.config.trackingManager.batchIntervals': `${config.trackingManagerConfig.batchIntervals as number * 1000}`,
        'sdk.config.trackingManager.poolMaxSize': `${params.sdkConfigTrackingManagerPoolMaxSize}`,
        'sdk.config.usingCustomVisitorCache': `${params.sdkConfigUsingCustomVisitorCache}`,
        'sdk.config.usingOnVisitorExposed': `${params.sdkConfigUsingOnVisitorExposed}`,
        'sdk.config.usingCustomHitCache': `${params.sdkConfigUsingCustomHitCache}`,
        'sdk.config.fetchThirdPartyData': `${params.sdkConfigFetchThirdPartyData}`,
        'sdk.config.fetchFlagsBufferingTime': `${10000}`,
        'sdk.config.disableDeveloperUsageTracking': `${params.sdkConfigDisableDeveloperUsageTracking}`,
        'sdk.config.nextFetchConfig': JSON.stringify(params.sdkConfigNextFetchConfig),
        'sdk.config.disableCache': `${params.sdkConfigDisableCache}`,

        'http.request.url': params.httpRequestUrl,
        'http.request.method': params.httpRequestMethod,
        'http.request.headers': JSON.stringify(params.httpRequestHeaders),
        'http.request.body': JSON.stringify(params.httpRequestBody),
        'http.response.url': params.httpResponseUrl,
        'http.response.method': params.httpResponseMethod,
        'http.response.headers': JSON.stringify(params.httpResponseHeaders),
        'http.response.code': `${params.httpResponseCode}`,
        'http.response.body': JSON.stringify(params.httpResponseBody),
        'visitor.status': params.visitorStatus,
        'visitor.instanceType': params.visitorInstanceType,
        'visitor.context.[key]': 'value',
        'visitor.consent': `${params.visitorConsent}`,
        'visitor.assignments.[key]': 'value',
        ...visitorFlags,
        'visitor.isAuthenticated': `${params.visitorIsAuthenticated}`,
        'flag.key': params.flagKey,
        'flag.value': params.flagValue,
        'flag.default': JSON.stringify(params.flagDefault),
        'flag.metadata.campaignId': params.flagMetadataCampaignId,
        'flag.metadata.campaignName': params.flagMetadataCampaignName,
        'flag.metadata.variationGroupId': params.flagMetadataVariationGroupId,
        'flag.metadata.variationGroupName': params.flagMetadataVariationGroupName,
        'flag.metadata.variationId': params.flagMetadataVariationId,
        'flag.metadata.variationName': params.flagMetadataVariationName,
        'flag.metadata.campaignSlug': params.flagMetadataCampaignSlug,
        'flag.metadata.campaignType': params.flagMetadataCampaignType,
        'visitor.campaignFromCache': JSON.stringify(params.visitorCampaignFromCache),
        'visitor.campaigns': JSON.stringify(params.visitorCampaigns),
        'visitor.initialCampaigns': JSON.stringify(params.visitorInitialCampaigns),
        'visitor.initialFlagsData': JSON.stringify(params.visitorInitialFlagsData),
        batchTriggeredBy: 'ActivateLength',
        contextKey: `${params.contextKey}`,
        contextValue: `${params.contextValue}`,
        'flag.metadata.isReference': `${params.flagMetadataCampaignIsReference}`,
        flagshipInstanceId: `${params.flagshipInstanceId}`,
        ...pageHit,
        'http.response.time': `${params.httpResponseTime}`,
        lastBucketingTimestamp: `${params.lastBucketingTimestamp}`,
        lastInitializationTimestamp: `${params.lastInitializationTimestamp}`,
        'visitor.sessionId': `${params.visitorSessionId}`,
        sdkBucketingFile: JSON.stringify(params.sdkBucketingFile),
        'visitor.visitorId': visitorId,
        'visitor.anonymousId': 'null',
        'accountSettings.eaiActivationEnabled': 'true',
        'accountSettings.eaiCollectEnabled': 'true',
        'eAIScore.eai.eas': eAIScore.eai.eas,
        isEAIScoreFromLocalCache: `${params.isEAIScoreFromLocalCache}`,
        eAIDataTimestamp: `${params.eAIDataTimestamp}`
      }
    }
     
    const apiKeys: Record<string, unknown> = {
      [VISITOR_ID_API_ITEM]: visitorId,
      [DS_API_ITEM]: SDK_APP,
      [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
      [T_API_ITEM]: 'TROUBLESHOOTING',
      cv: getCustomVariable()
    }

    const monitoring = new Troubleshooting(params)
    expect(monitoring.userIp).toBe(params.userIp)
    expect(monitoring.screenResolution).toBe(params.screenResolution)
    expect(monitoring.locale).toBe(params.locale)
    expect(monitoring.sessionNumber).toBe(params.sessionNumber)
    expect(monitoring.toApiKeys()).toEqual(apiKeys)
  })

  it('test isReady method ', () => {
    expect(troubleshooting.isReady()).toBeTruthy()
  })

  it('test isReady method', () => {
    expect(troubleshooting.isReady()).toBeTruthy()
    expect(troubleshooting.isReady(false)).toBeTruthy()
  })

  it('test toObject', () => {
    const userIp = '127.0.0.1'
    const screenResolution = '800X600'
    const locale = 'fr'
    const sessionNumber = '12345'
    const hitKey = 'key'
    troubleshooting.userIp = userIp
    troubleshooting.screenResolution = screenResolution
    troubleshooting.locale = locale
    troubleshooting.sessionNumber = sessionNumber
    troubleshooting.key = hitKey
    expect(troubleshooting.toObject()).toEqual(expect.objectContaining({
    }))
  })
})
