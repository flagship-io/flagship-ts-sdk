import { jest, expect, it, describe, afterAll } from '@jest/globals'
import { ERROR_MESSAGE } from '../../src/hit/Event'
import { DecisionApiConfig, IFlagshipConfig } from '../../src/config/index'
import {
  CacheStrategy,
  CUSTOMER_ENV_ID_API_ITEM,
  CUSTOMER_UID,
  DS_API_ITEM,
  EVENT_ACTION_API_ITEM,
  EVENT_CATEGORY_API_ITEM,
  LogLevel,
  QT_API_ITEM,
  SDK_APP,
  SDK_INFO,
  TYPE_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../../src/enum/index'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'
import { Mock } from 'jest-mock'
import { IMonitoring, Monitoring } from '../../src/hit/Monitoring'
import { version } from '../../src/sdkVersion'

describe('test hit type Monitoring', () => {
  const methodNow = Date.now
  const mockNow:Mock<number, []> = jest.fn()
  const visitorId = 'visitorId'
  Date.now = mockNow
  mockNow.mockReturnValue(1657899294744)
  afterAll(() => {
    Date.now = methodNow
  })

  // .mockImplementation(() => OriginalDate as any)
  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')
  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager
  const category = 'monitoring'
  const action = 'action'
  const message = 'message'
  const subComponent = 'subComponent'
  const logLevel = LogLevel.INFO
  const logVersion = '1'
  const component = `Flagship SDK ${SDK_INFO.name}`
  const stackType = 'SDK'
  const monitoring = new Monitoring({ action, visitorId, message, subComponent, logLevel, config })

  it('should ', () => {
    const apiKeys: Record<string, unknown> = {
      [VISITOR_ID_API_ITEM]: visitorId,
      [DS_API_ITEM]: SDK_APP,
      [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
      [T_API_ITEM]: 'MONITORING',
      [EVENT_CATEGORY_API_ITEM]: category,
      [EVENT_ACTION_API_ITEM]: action,
      [CUSTOMER_UID]: null,
      [QT_API_ITEM]: expect.anything(),
      cv: {
        0: `logVersion, ${logVersion}`,
        1: `LogLevel, ${LogLevel[logLevel]}`,
        3: `envId, ${config.envId}`,
        4: `timestamp, ${new Date(1657899294744).toISOString()}`,
        5: `component, ${component}`,
        6: `subComponents, ${subComponent}`,
        7: `message, ${message}`,
        20: `stack.type, ${'SDK'} `,
        21: `stack.name, ${SDK_INFO.name}`,
        22: `stack.version, ${version}`
      }
    }
    expect(monitoring.category).toBe('monitoring')
    expect(monitoring.action).toBe(action)
    expect(monitoring.ds).toBe(SDK_APP)
    expect(monitoring.message).toBe(message)
    expect(monitoring.subComponent).toBe(subComponent)
    expect(monitoring.logLevel).toBe(logLevel)
    expect(monitoring.logVersion).toBe(logVersion)
    expect(monitoring.component).toBe(component)
    expect(monitoring.stackType).toBe(stackType)
    expect(monitoring.visitorId).toBe(visitorId)
    expect(monitoring.anonymousId).toBeNull()
    expect(monitoring.getErrorMessage()).toBe(ERROR_MESSAGE)
    expect(monitoring.userIp).toBeUndefined()
    expect(monitoring.screenResolution).toBeUndefined()
    expect(monitoring.locale).toBeUndefined()
    expect(monitoring.sessionNumber).toBeUndefined()
    expect(monitoring.toApiKeys()).toEqual(apiKeys)
  })

  it('test constructor', () => {
    const params:Omit<IMonitoring & {config: IFlagshipConfig},
    'type'|'createdAt'|'category'> = {
      action,
      logLevel,
      accountId: 'accountId',
      envId: config.envId,
      component,
      subComponent,
      message,
      stackType: 'SDK',
      stackName: SDK_INFO.name,
      stackVersion: version,
      stackOriginName: 'this.stackOriginName',
      stackOriginVersion: 'this.stackOriginVersion',

      sdkStatus: 'this.sdkStatus',
      sdkConfigMode: 'this.sdkConfigMode',
      sdkConfigCustomLogManager: true,
      sdkConfigCustomCacheManager: false,
      sdkConfigStatusListener: false,
      sdkConfigTimeout: config.timeout.toString(),
      sdkConfigPollingTime: '10',
      sdkConfigTrackingManagerConfigStrategy: CacheStrategy[config.trackingMangerConfig.cacheStrategy as number],
      sdkConfigTrackingManagerConfigBatchIntervals: '30',
      sdkConfigTrackingManagerConfigBatchLength: '10',

      httpRequestUrl: 'this.httpRequestUrl',
      httpRequestMethod: 'this.httpRequestMethod',
      httpRequestHeaders: 'this.httpRequestHeaders',
      httpRequestBody: 'this.httpRequestBody',
      httpRequestDetails: 'this.httpRequestDetails',

      httpResponseUrl: 'this.httpResponseUrl',
      httpResponseMethod: 'this.httpResponseMethod',
      httpResponseHeaders: 'this.httpResponseHeaders',
      httpResponseCode: 'this.httpResponseCode',
      httpResponseBody: 'this.httpResponseBody',
      httpResponseDetails: 'this.httpResponseDetails',

      visitorStatus: 'this.visitorStatus',
      visitorInstanceType: 'this.visitorInstanceType',
      visitorContext: 'this.visitorContext',
      visitorConsent: true,
      visitorAssignmentHistory: 'this.visitorAssignmentHistory',
      visitorFlags: 'this.visitorFlags',
      visitorIsAuthenticated: false,

      flagKey: 'this.flagKey',
      flagValue: 'this.flagValue',
      flagDefault: 'this.flagDefault',
      flagMetadataCampaignId: 'this.flagMetadataCampaignId',
      flagMetadataVariationGroupId: 'this.flagMetadataVariationGroupId',
      flagMetadataVariationId: 'this.flagMetadataVariationId',
      flagMetadataCampaignSlug: 'this.flagMetadataCampaignSlug',
      flagMetadataCampaignType: 'this.flagMetadataCampaignType',
      visitorId,
      config
    }

    // eslint-disable-next-line complexity
    const getCustomVariable = () => {
      return {
        0: `logVersion, ${logVersion}`,
        1: `LogLevel, ${LogLevel[logLevel]}`,
        2: 'accountId, ' + params.accountId,
        3: `envId, ${config.envId}`,
        4: `timestamp, ${new Date(1657899294744).toISOString()}`,
        5: `component, ${component}`,
        6: `subComponents, ${subComponent}`,
        7: `message, ${message}`,
        20: `stack.type, ${'SDK'} `,
        21: `stack.name, ${SDK_INFO.name}`,
        22: `stack.version, ${version}`,
        23: 'stack.origin.name, ' + params.stackOriginName,
        24: 'stack.origin.version, ' + params.stackOriginVersion,
        30: 'sdk.status, ' + params.sdkStatus,
        31: 'sdk.config.mode, ' + params.sdkConfigMode,
        32: 'sdk.config.customLogManager, ' + params.sdkConfigCustomLogManager,
        33: 'sdk.config.customCacheManager, ' + params.sdkConfigCustomCacheManager,
        34: 'sdk.config.custom.StatusListener, ' + params.sdkConfigStatusListener,
        35: 'sdk.config.timeout, ' + params.sdkConfigTimeout,
        36: 'sdk.config.pollingTime, ' + params.sdkConfigPollingTime,
        37: 'sdk.config.trackingManager.config.strategy, ' + params.sdkConfigTrackingManagerConfigStrategy,
        38: 'sdk.config.trackingManager.config.batchIntervals, ' + params.sdkConfigTrackingManagerConfigBatchIntervals,
        39: 'sdk.config.trackingManager.config.batchLength, ' + params.sdkConfigTrackingManagerConfigBatchLength,
        50: 'http.request.url, ' + params.httpRequestUrl,
        51: 'http.request.method, ' + params.httpRequestMethod,
        52: 'http.request.headers, ' + params.httpRequestHeaders,
        53: 'http.request.body, ' + params.httpRequestBody,
        54: 'http.request.details, ' + params.httpRequestDetails,
        60: 'http.response.url, ' + params.httpResponseUrl,
        61: 'http.response.method, ' + params.httpResponseMethod,
        62: 'http.response.headers, ' + params.httpResponseHeaders,
        63: 'http.response.code, ' + params.httpResponseCode,
        64: 'http.response.body, ' + params.httpResponseBody,
        65: 'http.response.details, ' + params.httpResponseDetails,
        80: 'visitor.status, ' + params.visitorStatus,
        81: 'visitor.instanceType, ' + params.visitorInstanceType,
        82: 'visitor.context, ' + params.visitorContext,
        83: 'visitor.consent, ' + params.visitorConsent,
        84: 'visitor.assignmentsHistory, ' + params.visitorAssignmentHistory,
        85: 'visitor.flags, ' + params.visitorFlags,
        86: 'visitor.isAuthenticated, ' + params.visitorIsAuthenticated,
        100: 'flag.key, ' + params.flagKey,
        101: 'flag.value, ' + params.flagValue,
        102: 'flag.default, ' + params.flagDefault,
        103: 'flag.metadata.campaignId, ' + params.flagMetadataCampaignId,
        104: 'flag.metadata.variationGroupId, ' + params.flagMetadataVariationGroupId,
        105: 'flag.metadata.variationId, ' + params.flagMetadataVariationId,
        106: 'flag.metadata.campaignSlug, ' + params.flagMetadataCampaignSlug,
        107: 'flag.metadata.campaignType, ' + params.flagMetadataCampaignType
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiKeys: Record<string, unknown> = {
      [VISITOR_ID_API_ITEM]: visitorId,
      [DS_API_ITEM]: SDK_APP,
      [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
      [T_API_ITEM]: 'MONITORING',
      [EVENT_CATEGORY_API_ITEM]: category,
      [EVENT_ACTION_API_ITEM]: action,
      [CUSTOMER_UID]: null,
      [QT_API_ITEM]: expect.anything(),
      cv: getCustomVariable()
    }

    const monitoring = new Monitoring(params)
    expect(monitoring.category).toBe('monitoring')
    expect(monitoring.action).toBe(params.action)
    expect(monitoring.userIp).toBe(params.userIp)
    expect(monitoring.screenResolution).toBe(params.screenResolution)
    expect(monitoring.locale).toBe(params.locale)
    expect(monitoring.sessionNumber).toBe(params.sessionNumber)
    expect(monitoring.toApiKeys()).toEqual(apiKeys)
  })

  it('test isReady method ', () => {
    expect(monitoring.isReady()).toBeTruthy()
  })

  it('test isReady method', () => {
    expect(monitoring.isReady()).toBeTruthy()
    expect(monitoring.isReady(false)).toBeTruthy()
  })

  it('test toObject', () => {
    const userIp = '127.0.0.1'
    const screenResolution = '800X600'
    const locale = 'fr'
    const sessionNumber = '12345'
    const hitKey = 'key'
    monitoring.userIp = userIp
    monitoring.screenResolution = screenResolution
    monitoring.locale = locale
    monitoring.sessionNumber = sessionNumber
    monitoring.key = hitKey
    expect(monitoring.toObject()).toEqual({
      category,
      action,
      message,
      subComponent,
      logLevel,
      logVersion,
      component,
      stackType,
      envId: config.envId,
      userIp,
      screenResolution,
      locale,
      sessionNumber,
      key: hitKey,
      createdAt: expect.anything(),
      anonymousId: null,
      ds: SDK_APP,
      type: 'MONITORING',
      visitorId,
      stackVersion: version,
      stackName: SDK_INFO.name,
      timestamp: expect.anything(),
      accountId: undefined,
      flagDefault: undefined,
      flagKey: undefined,
      flagMetadataCampaignId: undefined,
      flagMetadataCampaignSlug: undefined,
      flagMetadataCampaignType: undefined,
      flagMetadataVariationGroupId: undefined,
      flagMetadataVariationId: undefined,
      flagValue: undefined,
      httpRequestBody: undefined,
      httpRequestDetails: undefined,
      httpRequestHeaders: undefined,
      httpRequestMethod: undefined,
      httpRequestUrl: undefined,
      httpResponseBody: undefined,
      httpResponseCode: undefined,
      httpResponseDetails: undefined,
      httpResponseHeaders: undefined,
      httpResponseMethod: undefined,
      httpResponseUrl: undefined,
      sdkConfigCustomCacheManager: undefined,
      sdkConfigCustomLogManager: undefined,
      sdkConfigMode: undefined,
      sdkConfigPollingTime: undefined,
      sdkConfigStatusListener: undefined,
      sdkConfigTimeout: undefined,
      sdkConfigTrackingManagerConfigBatchIntervals: undefined,
      sdkConfigTrackingManagerConfigBatchLength: undefined,
      sdkConfigTrackingManagerConfigStrategy: undefined,
      sdkStatus: undefined,

      stackOriginName: undefined,
      stackOriginVersion: undefined,
      visitorAssignmentHistory: undefined,
      visitorConsent: undefined,
      visitorContext: undefined,
      visitorFlags: undefined,
      visitorInstanceType: undefined,
      visitorIsAuthenticated: undefined,
      visitorStatus: undefined
    })
  })

  it('test log action ', () => {
    monitoring.action = ''
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'action', 'string'),
      'action'
    )
    expect(monitoring.action).toBe(action)
  })
})
