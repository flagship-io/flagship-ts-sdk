import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { ERROR_MESSAGE } from '../../src/hit/Event'
import { DecisionApiConfig, IFlagshipConfig } from '../../src/config/index'
import {
  BatchStrategy,
  CUSTOMER_ENV_ID_API_ITEM,
  CUSTOMER_UID,
  DS_API_ITEM,
  EVENT_ACTION_API_ITEM,
  EVENT_CATEGORY_API_ITEM,
  HitType,
  LogLevel,
  QT_API_ITEM,
  SDK_APP,
  SDK_LANGUAGE,
  TYPE_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../../src/enum/index'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'
import { Mock } from 'jest-mock'
import { IMonitoring, Monitoring } from '../../src/hit/Monitoring'
import { version } from '../../src/sdkVersion'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNull = (): any => {
  return null
}

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
  const component = `Flagship SDK ${SDK_LANGUAGE.name}`
  const stackType = 'SDK'
  const monitoring = new Monitoring({ action, visitorId, message, subComponent, logLevel, config })

  it('should ', () => {
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
  })

  it('test constructor', () => {
    const params:Omit<IMonitoring & {config: IFlagshipConfig},
    'type'|'createdAt'|'category'> = {
      action,
      logLevel,
      accountId: 'accountId',
      envId: config.envId,
      component: 'component',
      subComponent,
      message,
      stackType: 'this.stackType',
      stackName: 'this.stackName',
      stackVersion: 'this.stackVersion',
      stackOriginName: 'this.stackOriginName',
      stackOriginVersion: 'this.stackOriginVersion',

      sdkStatus: 'this.sdkStatus',
      sdkConfigMode: 'this.sdkConfigMode',
      sdkConfigCustomLogManager: true,
      sdkConfigCustomCacheManager: false,
      sdkConfigStatusListener: false,
      sdkConfigTimeout: config.timeout.toString(),
      sdkConfigPollingTime: config.pollingInterval?.toString(),
      sdkConfigTrackingManagerConfigStrategy: BatchStrategy[config.trackingMangerConfig.batchStrategy as number],
      sdkConfigTrackingManagerConfigBatchIntervals: config.trackingMangerConfig.batchIntervals?.toString(),
      sdkConfigTrackingManagerConfigBatchLength: config.trackingMangerConfig.batchLength?.toString(),

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
      userIp: '127.0.0.1',
      screenResolution: '800X600',
      locale: 'fr',
      sessionNumber: '12345',
      visitorId,
      config
    }

    const monitoring = new Monitoring(params)
    expect(monitoring.category).toBe('monitoring')
    expect(monitoring.action).toBe(params.action)
    expect(monitoring.userIp).toBe(params.userIp)
    expect(monitoring.screenResolution).toBe(params.screenResolution)
    expect(monitoring.locale).toBe(params.locale)
    expect(monitoring.sessionNumber).toBe(params.sessionNumber)
  })

  it('test isReady method ', () => {
    expect(monitoring.isReady()).toBeTruthy()
  })

  it('test isReady method', () => {
    expect(monitoring.isReady()).toBeTruthy()
    expect(monitoring.isReady(false)).toBeTruthy()
  })

  // eslint-disable-next-line complexity
  const getCustomVariable = () => {
    return {
      0: `logVersion, ${logVersion}`,
      1: `LogLevel, ${LogLevel[logLevel]}`,
      2: 'accountId, ',
      3: `envId, ${config.envId}`,
      4: `timestamp, ${new Date(1657899294744).toISOString()}`,
      5: `component, ${component}`,
      6: `subComponents, ${subComponent}`,
      7: `message, ${message}`,
      20: `stack.type, ${'SDK'} `,
      21: `stack.name, ${SDK_LANGUAGE.name}`,
      22: `stack.version, ${version}`,
      23: 'stack.origin.name, ',
      24: 'stack.origin.version, ',
      30: 'sdk.status, ',
      31: 'sdk.config.mode, ',
      32: 'sdk.config.customLogManager, ',
      33: 'sdk.config.customCacheManager, ',
      34: 'sdk.config.custom.StatusListener, ',
      35: 'sdk.config.timeout, ',
      36: 'sdk.config.pollingTime, ',
      37: 'sdk.config.trackingManager.config.strategy, ',
      38: 'sdk.config.trackingManager.config.batchIntervals, ',
      39: 'sdk.config.trackingManager.config.batchLength, ',
      50: 'http.request.url, ',
      51: 'http.request.method, ',
      52: 'http.request.headers, ',
      53: 'http.request.body, ',
      54: 'http.request.details, ',
      60: 'http.response.url, ',
      61: 'http.response.method, ',
      62: 'http.response.headers, ',
      63: 'http.response.code, ',
      64: 'http.response.body, ',
      65: 'http.response.details, ',
      80: 'visitor.status, ',
      81: 'visitor.instanceType, ',
      82: 'visitor.context, ',
      83: 'visitor.consent, ',
      84: 'visitor.assignmentsHistory, ',
      85: 'visitor.flags, ',
      86: 'visitor.isAuthenticated, ',
      100: 'flag.key, ',
      101: 'flag.value, ',
      102: 'flag.default, ',
      103: 'flag.metadata.campaignId, ',
      104: 'flag.metadata.variationGroupId, ',
      105: 'flag.metadata.variationId, ',
      106: 'flag.metadata.campaignSlug, ',
      107: 'flag.metadata.campaignType, '
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

  it('should ', () => {
    expect(monitoring.toApiKeys()).toEqual(apiKeys)
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
      stackName: SDK_LANGUAGE.name,
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
