import { FlagDTO } from './../../dist/types.d'
import { jest, expect, it, describe, afterAll } from '@jest/globals'
import { ERROR_MESSAGE } from '../../src/hit/Event'
import { BucketingConfig } from '../../src/config/index'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  CacheStrategy,
  DS_API_ITEM,
  FlagshipStatus,
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
  const label = 'VISITOR-FETCH-CAMPAIGNS'
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
    expect(troubleshooting.logLevel).toBe(logLevel)
    expect(troubleshooting.stackType).toBe(stackType)
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
      variationGroupId: 'variationGroupId',
      variationId: 'variationId',
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
      sdkStatus: FlagshipStatus.READY,
      sdkConfigMode: 'this.sdkConfigMode',
      sdkConfigCustomLogManager: true,
      sdkConfigCustomCacheManager: false,
      sdkConfigStatusListener: false,
      sdkConfigTimeout: config.timeout,
      sdkConfigPollingInterval: config.pollingInterval,
      sdkConfigTrackingManagerConfigStrategy: config.trackingManagerConfig.cacheStrategy,
      sdkConfigTrackingManagerConfigBatchIntervals: config.trackingManagerConfig.batchIntervals,
      sdkConfigTrackingManagerConfigPoolMaxSize: config.trackingManagerConfig.poolMaxSize,
      sdkConfigFetchNow: config.fetchNow,
      sdkConfigEnableClientCache: config.enableClientCache,
      sdkConfigInitialBucketing: config.initialBucketing,
      sdkConfigDecisionApiUrl: config.decisionApiUrl,
      sdkConfigHitDeduplicationTime: config.hitDeduplicationTime,
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
      flagMetadataVariationGroupId: 'this.flagMetadataVariationGroupId',
      flagMetadataVariationId: 'this.flagMetadataVariationId',
      flagMetadataCampaignSlug: 'this.flagMetadataCampaignSlug',
      flagMetadataCampaignType: 'this.flagMetadataCampaignType',
      flagMetadataCampaignIsReference: true,
      visitorId,
      config,
      lastBucketingTimestamp: '2023/01/01',
      lastInitializationTimestamp: '2023/01/01',
      flagshipInstanceId: 'flagshipInstanceId',
      visitorInstanceId: 'visitorInstanceId',
      sdkBucketingFile: {},
      contextKey: 'key',
      contextValue: 'value',
      hitContent: {},
      batchTriggeredBy: BatchTriggeredBy.ActivateLength
    }

    // eslint-disable-next-line complexity
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
        'sdk.status': `${FlagshipStatus[params.sdkStatus as number]}`,
        'sdk.config.mode': params.sdkConfigMode,
        'sdk.config.customLogManager': `${params.sdkConfigCustomLogManager}`,
        'sdk.config.customCacheManager': `${params.sdkConfigCustomCacheManager}`,
        'sdk.config.custom.StatusListener': `${params.sdkConfigStatusListener}`,
        'sdk.config.timeout': `${params.sdkConfigTimeout}`,
        'sdk.config.pollingTime': `${params.sdkConfigPollingInterval}`,
        'sdk.config.trackingManager.config.decisionApiUrl': `${params.sdkConfigDecisionApiUrl}`,
        'sdk.config.trackingManager.config.deduplicationTime': `${params.sdkConfigHitDeduplicationTime}`,
        'sdk.config.trackingManager.config.enableClientCache': `${params.sdkConfigEnableClientCache}`,
        'sdk.config.trackingManager.config.fetchNow': `${params.sdkConfigFetchNow}`,
        'sdk.config.trackingManager.config.initialBucketing': JSON.stringify(params.sdkConfigInitialBucketing),
        'sdk.config.trackingManager.config.strategy': `${CacheStrategy[params.sdkConfigTrackingManagerConfigStrategy as number]}`,
        'sdk.config.trackingManager.config.batchIntervals': `${params.sdkConfigTrackingManagerConfigBatchIntervals}`,
        'sdk.config.trackingManager.config.poolMaxSize': `${params.sdkConfigTrackingManagerConfigPoolMaxSize}`,
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
        'visitor.context.key': 'value',
        'visitor.consent': `${params.visitorConsent}`,
        'visitor.assignments.[key]': 'value',
        ...visitorFlags,
        'visitor.isAuthenticated': `${params.visitorIsAuthenticated}`,
        'flag.key': params.flagKey,
        'flag.value': params.flagValue,
        'flag.default': JSON.stringify(params.flagDefault),
        'flag.metadata.campaignId': params.flagMetadataCampaignId,
        'flag.metadata.variationGroupId': params.flagMetadataVariationGroupId,
        'flag.metadata.variationId': params.flagMetadataVariationId,
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
        'hit.content': JSON.stringify(params.hitContent),
        'http.response.time': `${params.httpResponseTime}`,
        lastBucketingTimestamp: `${params.lastBucketingTimestamp}`,
        lastInitializationTimestamp: `${params.lastInitializationTimestamp}`,
        'visitor.instanceId': `${params.visitorInstanceId}`,
        sdkBucketingFile: JSON.stringify(params.sdkBucketingFile),
        'visitor.visitorId': visitorId,
        'visitor.anonymousId': 'null'
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
