import { AUTHENTICATE, CONTEXT_KEY_ERROR, VISITOR_AUTHENTICATE_VISITOR_ID_ERROR, UNAUTHENTICATE, PROCESS_FETCHING_FLAGS, FLAG_VISITOR_EXPOSED, EAI_SCORE_CONTEXT_KEY } from './../../src/enum/FlagshipConstant'
import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { DecisionApiConfig, EAIScore, EventCategory, FetchFlagsStatus, FlagDTO, FSFlagMetadata, TroubleshootingLabel } from '../../src/index'
import { TrackingManager } from '../../src/api/TrackingManager'
import { BucketingConfig, ConfigManager } from '../../src/config/index'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { IHttpResponse, HttpClient } from '../../src/utils/HttpClient'
import { DefaultStrategy, HIT_NULL_ERROR } from '../../src/visitor/DefaultStrategy'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { CONTEXT_NULL_ERROR, CONTEXT_VALUE_ERROR, FLAGSHIP_VISITOR_NOT_AUTHENTICATE, FLAG_VALUE, FS_CONSENT, GET_FLAG_CAST_ERROR, GET_FLAG_MISSING_ERROR, HitType, PROCESS_SEND_HIT, PROCESS_UPDATE_CONTEXT, SDK_APP, SDK_INFO, TRACKER_MANAGER_MISSING_ERROR, USER_EXPOSED_CAST_ERROR, USER_EXPOSED_FLAG_ERROR } from '../../src/enum'
import { errorFormat, sprintf } from '../../src/utils/utils'
import { Activate } from '../../src/hit/Activate'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { BucketingManager } from '../../src/decision/BucketingManager'
import { Segment } from '../../src/hit/Segment'
import { Screen } from '../../src/hit/Screen'
import { Event } from '../../src/hit/Event'
import { returnFlag } from './flags'
import { FSFetchStatus } from '../../src/enum/FSFetchStatus'
import { FSFetchReasons } from '../../src/enum/FSFetchReasons'
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'
import { ISdkManager } from '../../src/main/ISdkManager'
import { BucketingDTO } from '../../src/decision/api/bucketingDTO'
import { IPageView } from '../../src/emotionAI/hit/IPageView'
import { IVisitorEvent } from '../../src/emotionAI/hit/IVisitorEvent'
import { UsageHit } from '../../src/hit/UsageHit'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNull = (): any => {
  return null
}

describe('test DefaultStrategy ', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')
  const logInfo = jest.spyOn(logManager, 'info')
  const logWarning = jest.spyOn(logManager, 'warning')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0, fetchFlagsBufferingTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const isPanicFn = jest.fn<()=>boolean>()
  apiManager.isPanic = isPanicFn

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const sendTroubleshootingHitSpy = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const murmurHash = new MurmurHash()

  const onFetchFlagsStatusChanged = jest.fn<({ status, reason }: FetchFlagsStatus) => void>()

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const collectEAIEventsAsync = jest.fn<(currentPage?: Omit<IPageView, 'toApiKeys'>) => void>()

  const reportVisitorEvent = jest.fn<(event: IVisitorEvent)=> Promise<void>>()

  const reportPageView = jest.fn<(pageView: IPageView) => Promise<void>>()

  const onEAICollectStatusChange = jest.fn<(callback: (status: boolean) => void) => void>()

  const cleanup = jest.fn<() => void>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore,
    collectEAIEventsAsync,
    reportVisitorEvent,
    reportPageView,
    onEAICollectStatusChange,
    cleanup
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, onFetchFlagsStatusChanged, emotionAi })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  const predefinedContext = {
    fs_client: SDK_INFO.name,
    fs_version: SDK_INFO.version,
    fs_users: visitorDelegate.visitorId
  }

  const newContext = {
    local: 'fr',
    color: 'red'
  }

  it('test setConsent hasTrackingManager', () => {
    configManager.trackingManager = getNull()
    defaultStrategy.setConsent(true)
    expect(visitorDelegate.hasConsented).toBeTruthy()
    expect(addHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      TRACKER_MANAGER_MISSING_ERROR,
      'setConsent'
    )
    configManager.trackingManager = trackingManager
  })

  it('test setConsent', () => {
    addHit.mockResolvedValue()
    defaultStrategy.setConsent(true)
    expect(visitorDelegate.hasConsented).toBeTruthy()
    expect(addHit).toBeCalledTimes(1)

    const consentHit = new Event({
      visitorId: visitorDelegate.visitorId,
      label: `${SDK_INFO.name}:${visitorDelegate.hasConsented}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })
    consentHit.ds = SDK_APP
    consentHit.config = config

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(addHit).toBeCalledWith({ ...consentHit })
  })

  it('test updateContext', () => {
    defaultStrategy.updateContext(newContext)
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext })
    expect(visitorDelegate.fetchStatus).toEqual({ status: FSFetchStatus.FETCH_REQUIRED, reason: FSFetchReasons.UPDATE_CONTEXT })

    expect(visitorDelegate.onFetchFlagsStatusChanged).toBe(onFetchFlagsStatusChanged)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledTimes(1)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledWith({ status: FSFetchStatus.FETCH_REQUIRED, reason: FSFetchReasons.UPDATE_CONTEXT })

    expect(visitorDelegate.hasContextBeenUpdated).toBeTruthy()
  })

  it('test updateContext null', () => {
    defaultStrategy.updateContext(getNull())
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(CONTEXT_NULL_ERROR, PROCESS_UPDATE_CONTEXT)
  })

  it('test updateContext invalid context key', () => {
    defaultStrategy.updateContext('', 'value')
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(CONTEXT_KEY_ERROR, visitorDelegate.visitorId, ''),
      PROCESS_UPDATE_CONTEXT
    )
  })

  it('test updateContext invalid context value', () => {
    defaultStrategy.updateContext('key', {} as string)
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(CONTEXT_VALUE_ERROR, visitorDelegate.visitorId, 'key'),
      PROCESS_UPDATE_CONTEXT
    )
  })

  it('test updateContext key/value', () => {
    const key = 'newKey'
    const value = 'newValue'
    defaultStrategy.updateContext(key, value)
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext, ...{ [key]: value } })
  })
  it('test clear Context', () => {
    defaultStrategy.clearContext()
    defaultStrategy.clearContext()
    expect(visitorDelegate.context).toEqual({
      fs_client: SDK_INFO.name,
      fs_version: SDK_INFO.version,
      fs_users: visitorId
    })
    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledTimes(1)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(1, { status: FSFetchStatus.FETCH_REQUIRED, reason: FSFetchReasons.UPDATE_CONTEXT })
  })

  it('test collectEAIData', () => {
    defaultStrategy.collectEAIEventsAsync()
    expect(emotionAi.collectEAIEventsAsync).toBeCalledTimes(1)
    expect(emotionAi.collectEAIEventsAsync).toBeCalledWith(undefined)
  })

  it('test collectEAIData', () => {
    const currentPage = {} as IPageView
    defaultStrategy.collectEAIEventsAsync(currentPage)
    expect(emotionAi.collectEAIEventsAsync).toBeCalledTimes(1)
    expect(emotionAi.collectEAIEventsAsync).toBeCalledWith(currentPage)
  })

  it('test reportEaiVisitorEvent', () => {
    const event = {} as IVisitorEvent
    defaultStrategy.reportEaiVisitorEvent(event)
    expect(emotionAi.reportVisitorEvent).toBeCalledTimes(1)
    expect(emotionAi.reportVisitorEvent).toBeCalledWith(event)
  })

  it('test reportEaiPageView', () => {
    const pageView = {} as IPageView
    defaultStrategy.reportEaiPageView(pageView)
    expect(emotionAi.reportPageView).toBeCalledTimes(1)
    expect(emotionAi.reportPageView).toBeCalledWith(pageView)
  })

  it('test onEAICollectStatusChange', () => {
    const callback = jest.fn()
    defaultStrategy.onEAICollectStatusChange(callback)
    expect(emotionAi.onEAICollectStatusChange).toBeCalledTimes(1)
    expect(emotionAi.onEAICollectStatusChange).toBeCalledWith(callback)
  })

  it('test cleanup', () => {
    defaultStrategy.cleanup()
    expect(emotionAi.cleanup).toBeCalledTimes(1)
  })

  it('test getCurrentDateTime', () => {
    const currentDate = defaultStrategy.getCurrentDateTime()
    expect(currentDate).toBeInstanceOf(Date)
  })

  const campaignDtoId = 'c2nrh1hjg50l9stringgu8bg'
  const campaignDTO = [
    {
      id: campaignDtoId,
      slug: 'slug',
      variationGroupId: 'id',
      variation: {
        id: '1dl',
        reference: false,
        modifications: {
          type: 'number',
          value: 12
        }
      }
    }
  ]

  it('test fetchFlags', async () => {
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined()
    })

    fetchEAIScore.mockResolvedValue({
      eai: {
        eas: 'straightforward'
      }
    })

    getCampaignsAsync.mockResolvedValue(campaignDTO)
    getModifications.mockReturnValue(returnFlag)
    await defaultStrategy.fetchFlags()
    expect(getCampaignsAsync).toBeCalledTimes(1)
    expect(getCampaignsAsync).toBeCalledWith(visitorDelegate)
    expect(visitorDelegate.fetchStatus).toEqual({ status: FSFetchStatus.FETCHED, reason: FSFetchReasons.NONE })

    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledTimes(2)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(1, { status: FSFetchStatus.FETCHING, reason: FSFetchReasons.NONE })
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(2, { status: FSFetchStatus.FETCHED, reason: FSFetchReasons.NONE })
    expect(emotionAi.fetchEAIScore).toBeCalledTimes(1)
    expect(visitorDelegate.context[EAI_SCORE_CONTEXT_KEY]).toEqual('straightforward')
  })

  it('test fetchFlags panic mode ', async () => {
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined()
    })
    getCampaignsAsync.mockResolvedValue([])
    getModifications.mockReturnValue(returnFlag)

    isPanicFn.mockReturnValue(true)

    await defaultStrategy.fetchFlags()
    expect(visitorDelegate.fetchStatus).toEqual({ status: FSFetchStatus.PANIC, reason: FSFetchReasons.NONE })

    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledTimes(2)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(1, { status: FSFetchStatus.FETCHING, reason: FSFetchReasons.NONE })
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(2, { status: FSFetchStatus.PANIC, reason: FSFetchReasons.NONE })

    isPanicFn.mockReturnValue(false)
  })

  it('test getFlagValue', () => {
    const returnMod = returnFlag.get('keyString') as FlagDTO
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue: 'defaultValues', flag: returnMod })
    expect<string>(value).toBe(returnMod.value)
  })

  it('test getFlagValue', () => {
    const returnMod = {
      key: 'keyBoolean',
      campaignId: 'c2nrh1hjg50l9thhu8bgkeyB',
      variationGroupId: 'c2nrh1hjg50l9thhu8cgKeyBoolean',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      isReference: false,
      value: false,
      campaignName: 'campaignName-1',
      variationGroupName: 'variationGroupName-1',
      variationName: 'variationName-1'
    }
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue: true, flag: returnMod })
    expect(value).toBe(returnMod.value)
  })

  it('test getFlagValue', () => {
    const returnMod = {
      key: 'keyBoolean',
      campaignId: 'c2nrh1hjg50l9thhu8bgkeyB',
      variationGroupId: 'c2nrh1hjg50l9thhu8cgKeyBoolean',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      isReference: false,
      value: 0,
      campaignName: 'campaignName-1',
      variationGroupName: 'variationGroupName-1',
      variationName: 'variationName-1'
    }
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue: 1, flag: returnMod })
    expect(value).toBe(returnMod.value)
  })

  it('test getFlagValue', () => {
    const returnMod = returnFlag.get('keyString') as FlagDTO
    const defaultValue = 'defaultValues'
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue: 'defaultValues', flag: returnMod, visitorExposed: true })
    expect<string>(value).toBe(returnMod.value)
    expect(activateFlag).toBeCalledTimes(1)
    const activateHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: defaultValue,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug,
        campaignName: returnMod.campaignName,
        variationGroupName: returnMod.variationGroupName,
        variationName: returnMod.variationName
      }
    })

    activateHit.config = config
    activateHit.ds = SDK_APP
    expect(activateFlag).toBeCalledWith(activateHit)
  })

  it('test getFlagValue with defaultValue null', () => {
    const returnMod = returnFlag.get('keyString') as FlagDTO
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue: null, flag: returnMod, visitorExposed: true })
    expect(value).toBe(returnMod.value)
    expect(activateFlag).toBeCalledTimes(1)
    const campaignHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: null,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug,
        campaignName: returnMod.campaignName,
        variationGroupName: returnMod.variationGroupName,
        variationName: returnMod.variationName
      }
    })
    campaignHit.config = config
    campaignHit.ds = SDK_APP
    expect(activateFlag).toBeCalledWith(campaignHit)
    expect(logInfo).toBeCalledTimes(0)
  })

  it('test getFlagValue with defaultValue undefined', () => {
    const returnMod = returnFlag.get('keyString') as FlagDTO
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue: undefined, flag: returnMod, visitorExposed: true })
    expect(value).toBe(returnMod.value)
    expect(activateFlag).toBeCalledTimes(1)
    const campaignHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: undefined,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug,
        campaignName: returnMod.campaignName,
        variationGroupName: returnMod.variationGroupName,
        variationName: returnMod.variationName
      }
    })
    campaignHit.config = config
    campaignHit.ds = SDK_APP

    expect(activateFlag).toBeCalledWith(campaignHit)
    expect(logInfo).toBeCalledTimes(0)
  })

  it('test getFlagValue with defaultValue undefined', () => {
    const returnMod = returnFlag.get('keyNull') as FlagDTO
    const defaultValue = undefined
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue, flag: returnMod, visitorExposed: true })
    expect(value).toBe(defaultValue)
    expect(activateFlag).toBeCalledTimes(1)
    const campaignHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: defaultValue,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug,
        campaignName: returnMod.campaignName,
        variationGroupName: returnMod.variationGroupName,
        variationName: returnMod.variationName
      }
    })
    campaignHit.config = config
    campaignHit.visitorId = visitorId
    campaignHit.ds = SDK_APP
    expect(activateFlag).toBeCalledWith(campaignHit)
    expect(logInfo).toBeCalledTimes(0)
  })

  it('test getFlagValue undefined flag with default value null', () => {
    const returnMod = returnFlag.get('keyString') as FlagDTO
    const defaultValue = null
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue })
    expect(value).toBe(defaultValue)
    expect(activateFlag).toBeCalledTimes(0)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(sprintf(GET_FLAG_MISSING_ERROR, visitorId, 'keyString', defaultValue), FLAG_VALUE)
  })

  it('test getFlagValue undefined flag', () => {
    const returnMod = returnFlag.get('keyString') as FlagDTO
    const defaultValue = 'defaultValues'
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue })
    expect<string>(value).toBe(defaultValue)
    expect(activateFlag).toBeCalledTimes(0)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(sprintf(GET_FLAG_MISSING_ERROR, visitorId, 'keyString', defaultValue), FLAG_VALUE)
    expect(sendTroubleshootingHitSpy).toBeCalledTimes(1)
    const label: TroubleshootingLabel = TroubleshootingLabel.GET_FLAG_VALUE_FLAG_NOT_FOUND
    expect(sendTroubleshootingHitSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test getFlagValue castError type', () => {
    const returnMod = returnFlag.get('keyString') as FlagDTO
    const defaultValue = 1
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue, flag: returnMod })
    expect(value).toBe(defaultValue)
    expect(activateFlag).toBeCalledTimes(0)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(sprintf(GET_FLAG_CAST_ERROR, visitorId, 'keyString', defaultValue), FLAG_VALUE)
    expect(sendTroubleshootingHitSpy).toBeCalledTimes(1)
    const label: TroubleshootingLabel = TroubleshootingLabel.GET_FLAG_VALUE_TYPE_WARNING
    expect(sendTroubleshootingHitSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test getFlagValue castError type', () => {
    const returnMod = returnFlag.get('keyNull') as FlagDTO
    const defaultValue = 1
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue, flag: returnMod, visitorExposed: true })
    expect(value).toBe(defaultValue)
    expect(activateFlag).toBeCalledTimes(1)
  })

  it('test getFlagValue castError type', () => {
    const returnMod = returnFlag.get('array') as FlagDTO
    const defaultValue = {}
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue, flag: returnMod })
    expect(value).toEqual(defaultValue)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(sprintf(GET_FLAG_CAST_ERROR, visitorId, 'array', defaultValue), FLAG_VALUE)
    expect(activateFlag).toBeCalledTimes(0)
  })

  it('test getFlagMetadata', () => {
    const key = 'key'
    const metadata:FSFlagMetadata = {
      campaignId: 'campaignID',
      variationGroupId: 'variationGroupId',
      variationId: 'variationId',
      isReference: false,
      campaignType: 'ab',
      slug: 'slug',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    }
    const flag:FlagDTO = {
      key,
      campaignId: 'campaignID',
      variationGroupId: 'variationGroupId',
      variationId: 'variationId',
      isReference: false,
      campaignType: 'ab',
      slug: 'slug',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName',
      value: 'value'
    }
    const flagMeta = defaultStrategy.getFlagMetadata({ key, flag })
    expect(flagMeta).toEqual(metadata)
    expect(logInfo).toBeCalledTimes(0)
  })

  const notExitKey = 'notExitKey'

  const returnMod = returnFlag.get('keyString') as FlagDTO

  it('test visitorExposed', async () => {
    await defaultStrategy.visitorExposed({ key: returnMod.key, flag: returnMod, defaultValue: returnMod.value, hasGetValueBeenCalled: true })
    expect(activateFlag).toBeCalledTimes(1)
    const activateHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: returnMod.value,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug,
        campaignName: returnMod.campaignName,
        variationGroupName: returnMod.variationGroupName,
        variationName: returnMod.variationName
      }
    })
    activateHit.config = config
    activateHit.visitorId = visitorId
    activateHit.ds = SDK_APP

    expect(activateFlag).toBeCalledWith(activateHit)
    expect(sendTroubleshootingHitSpy).toBeCalledTimes(1)
    const label: TroubleshootingLabel = TroubleshootingLabel.VISITOR_SEND_ACTIVATE
    expect(sendTroubleshootingHitSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test visitorExposed, getValue has not been called', async () => {
    await defaultStrategy.visitorExposed({ key: returnMod.key, flag: returnMod, defaultValue: returnMod.value, hasGetValueBeenCalled: false })
    expect(activateFlag).toBeCalledTimes(0)

    expect(sendTroubleshootingHitSpy).toBeCalledTimes(1)
    const label: TroubleshootingLabel = TroubleshootingLabel.FLAG_VALUE_NOT_CALLED
    expect(sendTroubleshootingHitSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test visitorExposed with different type', async () => {
    await defaultStrategy.visitorExposed({ key: returnMod.key, flag: returnMod, defaultValue: true, hasGetValueBeenCalled: true })
    expect(addHit).toBeCalledTimes(0)
    expect(activateFlag).toBeCalledTimes(0)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(
      sprintf(USER_EXPOSED_CAST_ERROR, visitorId, returnMod.key),
      FLAG_VISITOR_EXPOSED
    )
    expect(sendTroubleshootingHitSpy).toBeCalledTimes(1)
    const label: TroubleshootingLabel = TroubleshootingLabel.VISITOR_EXPOSED_TYPE_WARNING
    expect(sendTroubleshootingHitSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test visitorExposed flag undefined', async () => {
    await defaultStrategy.visitorExposed({ key: notExitKey, flag: undefined, defaultValue: false, hasGetValueBeenCalled: true })
    expect(activateFlag).toBeCalledTimes(0)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(
      sprintf(USER_EXPOSED_FLAG_ERROR, visitorId, notExitKey),
      FLAG_VISITOR_EXPOSED
    )
    expect(sendTroubleshootingHitSpy).toBeCalledTimes(1)
    const label: TroubleshootingLabel = TroubleshootingLabel.VISITOR_EXPOSED_FLAG_NOT_FOUND
    expect(sendTroubleshootingHitSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  const hitScreen = new Screen({ documentLocation: 'home', visitorId })

  it('test sendHit', async () => {
    await defaultStrategy.sendHit(hitScreen)
    expect(addHit).toBeCalledTimes(1)
    expect(addHit).toBeCalledWith(hitScreen)
    expect(sendTroubleshootingHitSpy).toBeCalledTimes(1)
    const label: TroubleshootingLabel = TroubleshootingLabel.VISITOR_SEND_HIT
    expect(sendTroubleshootingHitSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test hasTrackingManager sendHit', async () => {
    configManager.trackingManager = getNull()
    await defaultStrategy.sendHit(hitScreen)

    expect(addHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      TRACKER_MANAGER_MISSING_ERROR,
      PROCESS_SEND_HIT
    )

    configManager.trackingManager = trackingManager
  })

  it('test hasTrackingManager sendHits', async () => {
    configManager.trackingManager = getNull()
    await defaultStrategy.sendHits([hitScreen])

    expect(addHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      TRACKER_MANAGER_MISSING_ERROR,
      PROCESS_SEND_HIT
    )
    configManager.trackingManager = trackingManager
  })

  it('test sendHitAsync', async () => {
    try {
      await defaultStrategy.sendHit(hitScreen)
      expect(addHit).toBeCalledTimes(1)
      expect(addHit).toBeCalledWith(hitScreen)
    } catch (error) {
      expect(logError).toBeCalled()
    }
  })

  it('test sendHitAsync with literal object Event ', async () => {
    try {
      const hit = {
        type: HitType.EVENT,
        action: 'action_1',
        category: EventCategory.ACTION_TRACKING
      }
      await defaultStrategy.sendHit(hit)
      expect(addHit).toBeCalledTimes(1)
      expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    } catch (error) {
      expect(logError).toBeCalled()
    }
  })

  it('test sendHitAsync with literal object ITEM ', async () => {
    try {
      const hit = {
        type: HitType.ITEM,
        transactionId: 'transaction_id_1',
        productName: 'name',
        productSku: '0014'
      }
      await defaultStrategy.sendHit(hit)
      expect(addHit).toBeCalledTimes(1)
      expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    } catch (error) {
      expect(logError).toBeCalled()
    }
  })

  it('test sendHitAsync with literal object PAGE ', async () => {
    const hit = {
      type: HitType.PAGE_VIEW,
      documentLocation: 'home'
    }
    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(1)
  })

  it('test sendHitAsync with literal object PAGE ', async () => {
    const hit = {
      type: 'PAGEVIEW' as HitType,
      documentLocation: 'home'
    }

    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, type: HitType.PAGE_VIEW, visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(1)
  })

  it('test sendHitAsync with literal object SCREEN ', async () => {
    const hit = {
      type: HitType.SCREEN_VIEW,
      documentLocation: 'home'
    }
    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(1)
  })

  it('test sendHitAsync with literal object PAGE ', async () => {
    const hit = {
      type: 'SCREENVIEW' as HitType,
      documentLocation: 'home'
    }

    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, type: HitType.SCREEN_VIEW, visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(1)
  })

  it('test sendHitAsync with literal object TRANSACTION ', async () => {
    const hit = {
      type: HitType.TRANSACTION,
      transactionId: 'transactionId',
      affiliation: 'affiliation'
    }
    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(1)
  })

  it('test sendHitAsync with literal object using incorrect type', async () => {
    const hit = {
      type: 'INCORRECT_TYPE' as HitType,
      transactionId: 'transactionId',
      affiliation: 'affiliation'
    }
    try {
      await defaultStrategy.sendHit(hit)
      expect(logError).toBeCalled()
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(addHit).toBeCalledTimes(0)
  })

  it('test sendHitAsync with literal object TRANSACTION ', async () => {
    const hits = [{
      type: HitType.TRANSACTION,
      transactionId: 'transactionId',
      affiliation: 'affiliation'
    },
    {
      type: HitType.TRANSACTION,
      transactionId: 'transactionId_2',
      affiliation: 'affiliation_2'
    }]
    try {
      await defaultStrategy.sendHits(hits)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    // await sleep(4000)
    expect(addHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ ...hits[0], visitorId, ds: SDK_APP, config }))
    expect(addHit).toHaveBeenNthCalledWith(2, expect.objectContaining({ ...hits[1], visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(2)
  })

  it('test sendHit failed', async () => {
    try {
      const error = 'Error'
      addHit.mockRejectedValue(error)
      await defaultStrategy.sendHit(hitScreen)
      expect(addHit).toBeCalledTimes(1)
      expect(addHit).toBeCalledWith(hitScreen)
    } catch (error) {
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(error, PROCESS_SEND_HIT)
    }
  })

  it('test sendHitAsync with is ready method to false', async () => {
    addHit.mockResolvedValue()
    const hits = [{
      type: HitType.TRANSACTION,
      transactionId: '',
      affiliation: ''
    },
    {
      type: HitType.TRANSACTION,
      transactionId: 'transactionId_2',
      affiliation: 'affiliation_2'
    }]
    await defaultStrategy.sendHits(hits)

    expect(addHit).toBeCalledTimes(1)
    expect(addHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ ...hits[1], visitorId, ds: SDK_APP, config }))
    expect(logError).toBeCalledTimes(1)
  })

  it('test sendHitAsync with is ready method to false', async () => {
    await defaultStrategy.sendHit(getNull())
    expect(addHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(HIT_NULL_ERROR, PROCESS_SEND_HIT)
  })

  it('test unauthenticate with null anonymousId', () => {
    defaultStrategy.unauthenticate()
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBe(null)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(FLAGSHIP_VISITOR_NOT_AUTHENTICATE, visitorId), UNAUTHENTICATE)
  })

  it('test authenticate with null visitorId', () => {
    defaultStrategy.authenticate(getNull())
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBeNull()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(VISITOR_AUTHENTICATE_VISITOR_ID_ERROR, visitorId), AUTHENTICATE)
  })

  const authenticateId = 'authenticateId'
  it('test authenticate', () => {
    defaultStrategy.authenticate(authenticateId)
    expect(visitorDelegate.visitorId).toBe(authenticateId)
    expect(visitorDelegate.anonymousId).toBe(visitorId)
    expect(sendTroubleshootingHitSpy).toBeCalledTimes(1)
    const label: TroubleshootingLabel = TroubleshootingLabel.VISITOR_AUTHENTICATE
    expect(sendTroubleshootingHitSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
    expect(visitorDelegate.fetchStatus).toEqual({ status: FSFetchStatus.FETCH_REQUIRED, reason: FSFetchReasons.AUTHENTICATE })

    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledTimes(1)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(1, { status: FSFetchStatus.FETCH_REQUIRED, reason: FSFetchReasons.AUTHENTICATE })
  })

  it('test multiple authentication ', () => {
    defaultStrategy.authenticate('authenticateId2')
    expect(visitorDelegate.visitorId).toBe(authenticateId)
    expect(visitorDelegate.anonymousId).toBe(visitorId)
    expect(sendTroubleshootingHitSpy).toBeCalledTimes(0)

    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledTimes(0)
    expect(logWarning).toBeCalledTimes(1)
  })

  it('test unauthenticate', () => {
    defaultStrategy.unauthenticate()
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBeNull()
    expect(visitorDelegate.fetchStatus).toEqual({ status: FSFetchStatus.FETCH_REQUIRED, reason: FSFetchReasons.UNAUTHENTICATE })
    expect(sendTroubleshootingHitSpy).toBeCalledTimes(1)
    const label: TroubleshootingLabel = TroubleshootingLabel.VISITOR_UNAUTHENTICATE
    expect(sendTroubleshootingHitSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))

    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledTimes(1)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(1, { status: FSFetchStatus.FETCH_REQUIRED, reason: FSFetchReasons.UNAUTHENTICATE })
  })

  it('test updateCampaigns', () => {
    const modifications = new Map<string, FlagDTO>([['key',
      {
        key: '',
        campaignId: '',
        variationGroupId: '',
        variationId: '',
        isReference: false,
        value: '',
        campaignName: '',
        variationGroupName: '',
        variationName: ''
      }]])
    getModifications.mockReturnValue(modifications)
    const campaigns = [{
      id: 'c2nrh1hjg50l9thhu8bg',
      variationGroupId: 'c2nrh1hjg50l9thhu8cg',
      variation: {
        id: 'c2nrh1hjg50l9thhu8dg',
        modifications: {
          type: 'JSON',
          value: {
            key: 'value'
          }
        },
        reference: false
      }
    }]
    defaultStrategy.updateCampaigns(campaigns)
    expect(visitorDelegate.campaigns).toEqual(campaigns)
    expect(visitorDelegate.flagsData).toEqual(modifications)
  })

  it('test updateCampaigns throw error', () => {
    const error = 'error'
    getModifications.mockImplementation(() => {
      throw error
    })
    const campaigns = [{
      id: 'c2nrh1hjg50l9thhu8bg',
      variationGroupId: 'c2nrh1hjg50l9thhu8cg',
      variation: {
        id: 'c2nrh1hjg50l9thhu8dg',
        modifications: {
          type: 'JSON',
          value: {
            key: 'value'
          }
        },
        reference: false
      }
    }]
    defaultStrategy.updateCampaigns(campaigns)
    expect(logError).toBeCalledTimes(1)
  })
})

describe('test DefaultStrategy fetch flags buffering', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logInfo = jest.spyOn(logManager, 'info')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)
  const murmurHash = new MurmurHash()
  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  const campaignDtoId = 'c2nrh1hjg50l9stringgu8bg'
  const campaignDTO = [
    {
      id: campaignDtoId,
      slug: 'slug',
      variationGroupId: 'id',
      variation: {
        id: '1dl',
        reference: false,
        modifications: {
          type: 'number',
          value: 12
        }
      }
    }
  ]

  it('should fetch flags with buffering', async () => {
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined()
    })
    getCampaignsAsync.mockResolvedValue(campaignDTO)
    getModifications.mockReturnValue(returnFlag)
    await defaultStrategy.fetchFlags()
    await defaultStrategy.fetchFlags()
    expect(getCampaignsAsync).toBeCalledTimes(1)
    expect(getCampaignsAsync).toBeCalledWith(visitorDelegate)
    expect(logInfo).toBeCalledTimes(1)

    visitorDelegate.updateContext('key', 'value1')
    await defaultStrategy.fetchFlags()
    expect(getCampaignsAsync).toBeCalledTimes(2)
  })

  it('should fetch flags without buffering', async () => {
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined()
    })
    getCampaignsAsync.mockResolvedValue(campaignDTO)
    getModifications.mockReturnValue(returnFlag)
    config.fetchFlagsBufferingTime = -1
    await defaultStrategy.fetchFlags()
    await defaultStrategy.fetchFlags()
    expect(getCampaignsAsync).toBeCalledTimes(2)
    expect(getCampaignsAsync).toBeCalledWith(visitorDelegate)
    expect(logInfo).toBeCalledTimes(0)
  })

  it('should fetch flags with zero buffering time', async () => {
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined()
    })
    getCampaignsAsync.mockResolvedValue(campaignDTO)
    getModifications.mockReturnValue(returnFlag)
    config.fetchFlagsBufferingTime = 0
    await defaultStrategy.fetchFlags()
    await defaultStrategy.fetchFlags()
    expect(getCampaignsAsync).toBeCalledTimes(2)
    expect(getCampaignsAsync).toBeCalledWith(visitorDelegate)
    expect(logInfo).toBeCalledTimes(0)
  })

  it('should fetch flags only once when another fetch call is in progress', async () => {
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined()
    })
    getCampaignsAsync.mockResolvedValue(campaignDTO)
    getModifications.mockReturnValue(returnFlag)
    config.fetchFlagsBufferingTime = 0
    await Promise.all([defaultStrategy.fetchFlags(), defaultStrategy.fetchFlags()])
    expect(getCampaignsAsync).toBeCalledTimes(1)
    expect(getCampaignsAsync).toBeCalledWith(visitorDelegate)
    expect(logInfo).toBeCalledTimes(0)
  })
})

describe('test authenticate on bucketing mode', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new BucketingConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const trackingManager = new TrackingManager({} as HttpClient, config)

  const configManager = new ConfigManager(config, {} as ApiManager, trackingManager)

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
  const murmurHash = new MurmurHash()
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test authenticate on bucketing mode', () => {
    const authenticateId = 'authenticateId'
    defaultStrategy.authenticate(authenticateId)
    expect(visitorDelegate.visitorId).toBe(authenticateId)
    expect(visitorDelegate.anonymousId).toBe(visitorId)
    // expect(logError).toBeCalledTimes(1)
    // expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_BUCKETING_ERROR, visitorId, AUTHENTICATE), AUTHENTICATE)
  })

  it('test unauthenticate on bucketing mode', () => {
    defaultStrategy.unauthenticate()
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBe(null)
    // expect(logError).toBeCalledTimes(1)
    // expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_BUCKETING_ERROR, visitorId, UNAUTHENTICATE), UNAUTHENTICATE)
  })
})

describe('test fetchFlags errors', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {}

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const onFetchFlagsStatusChanged = jest.fn<({ status, reason }: FetchFlagsStatus) => void>()

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, onFetchFlagsStatusChanged, emotionAi })

  const murmurHash = new MurmurHash()

  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test fetchFlags error', async () => {
    const error = new Error('message 1')
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeDefined()
      expect(err.message).toEqual(error.message)
    })

    getCampaignsAsync.mockRejectedValue(error)

    await defaultStrategy.fetchFlags()
    expect(logError).toBeCalled()
    expect(logError).toBeCalledWith(error.message, PROCESS_FETCHING_FLAGS)

    expect(visitorDelegate.onFetchFlagsStatusChanged).toBe(onFetchFlagsStatusChanged)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledTimes(2)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(1, { status: FSFetchStatus.FETCHING, reason: FSFetchReasons.NONE })
    expect(visitorDelegate.onFetchFlagsStatusChanged).toHaveBeenNthCalledWith(2, { status: FSFetchStatus.FETCH_REQUIRED, reason: FSFetchReasons.FETCH_ERROR })
  })
})

describe('test fetchFlags errors 2', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {}

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })

  const murmurHash = new MurmurHash()

  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test fetchFlags error 2', async () => {
    const error = new Error('message 2')
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeDefined()
      expect(err.message).toEqual(error.message)
    })

    getCampaignsAsync.mockResolvedValue([])

    const extractFlagsMock = jest.spyOn(defaultStrategy as any, 'extractFlags')
    extractFlagsMock.mockImplementation(() => {
      throw error
    })

    await defaultStrategy.fetchFlags()
    expect(logError).toBeCalled()
    expect(logError).toBeCalledWith(errorFormat(error.message, {
      visitorId,
      anonymousId: visitorDelegate.anonymousId,
      context: visitorDelegate.context,
      statusReason: FSFetchReasons.NONE,
      duration: 0
    }), PROCESS_FETCHING_FLAGS)
  })
})

describe('test DefaultStrategy troubleshootingHit 1', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0, fetchFlagsBufferingTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const murmurHash = new MurmurHash()
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  apiManager.troubleshooting = {
    startDate: new Date(),
    endDate: new Date(),
    traffic: 100,
    timezone: 'time'
  }

  it('test fetchFlags', async () => {
    const campaignDTO = [
      {
        id: 'c2nrh1hjg50l9thhu8bg',
        variationGroupId: 'c2nrh1hjg50l9thhu8cg',
        variation: {
          id: 'c2nrh1hjg50l9thhu8dg',
          modifications: {
            type: 'JSON',
            value: {
              key: 'value'
            }
          },
          reference: false
        }
      }
    ]
    getCampaignsAsync.mockResolvedValue(campaignDTO)

    await defaultStrategy.fetchFlags()

    expect(sendTroubleshootingHit).toBeCalledTimes(2)

    const label: TroubleshootingLabel = TroubleshootingLabel.VISITOR_FETCH_CAMPAIGNS
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))

    const label1: TroubleshootingLabel = TroubleshootingLabel.VISITOR_SEND_HIT
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(2, expect.objectContaining({ label: label1 }))

    defaultStrategy.setConsent(true)

    expect(sendTroubleshootingHit).toBeCalledTimes(3)

    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(3, expect.objectContaining({ label: label1 }))

    await defaultStrategy.fetchFlags()

    expect(sendTroubleshootingHit).toBeCalledTimes(4)
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(4, expect.objectContaining({ label }))
  })
})

describe('test DefaultStrategy troubleshootingHit Bucketing mode', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const bucketing = {
    campaigns: [
      {
        id: 'c1ndsu87m030114t8uu0',
        type: 'toggle',
        slug: 'campaign_1',
        variationGroups: [
          {
            id: 'c1ndsu87m030114t8uv0',
            targeting: {
              targetingGroups: [
                {
                  targetings: [
                    {
                      operator: 'EQUALS',
                      key: 'fs_users',
                      value: 'visitor_1'
                    }
                  ]
                }
              ]
            },
            variations: [
              {
                id: 'c1ndsu87m030114t8uvg',
                modifications: {
                  type: 'FLAG',
                  value: {
                    background: 'bleu ciel',
                    btnColor: '#EE3300',
                    keyBoolean: false,
                    keyNumber: 5660
                  }
                },
                allocation: 100
              }
            ]
          }
        ]
      }],

    accountSettings: {
      troubleshooting: {
        startDate: '2023-04-13T09:33:38.049Z',
        endDate: '2023-04-13T10:03:38.049Z',
        timezone: 'Europe/Paris',
        traffic: 40
      },
      eaiCollectEnabled: false,
      eaiActivationEnabled: false
    }
  }

  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>()

  const sdkManager = {
    getBucketingContent
  } as unknown as ISdkManager

  getBucketingContent.mockReturnValue(bucketing)

  const config = new BucketingConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0, initialBucketing: bucketing })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)
  const murmurHash = new MurmurHash()

  const decisionManager = new BucketingManager({ httpClient, config, murmurHash, sdkManager })

  const getModifications = jest.spyOn(
    decisionManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, decisionManager, trackingManager)

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test fetchFlags', async () => {
    const flagDTO: FlagDTO = {
      key: 'key',
      campaignId: 'campaignId',
      campaignName: 'campaignName',
      variationGroupId: 'variationGroupId',
      variationGroupName: 'variationGroupName',
      variationId: 'variationId',
      variationName: 'variationName',
      value: 'value'
    }
    const flags = new Map<string, FlagDTO>().set(flagDTO.key, flagDTO)
    // getCampaignsAsync.mockResolvedValue([])
    getModifications.mockReturnValueOnce(flags)

    await defaultStrategy.fetchFlags()

    expect(sendTroubleshootingHit).toBeCalledTimes(3)

    let label = 'VISITOR_FETCH_CAMPAIGNS'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
    label = 'VISITOR_SEND_HIT'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(2, expect.objectContaining({ label, hitContent: expect.objectContaining({ t: 'EVENT' }) }))

    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(3, expect.objectContaining({ label, hitContent: expect.objectContaining({ t: 'SEGMENT' }) }))
  })
})

describe('test DefaultStrategy troubleshootingHit send SEGMENT HIT', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const murmurHash = new MurmurHash()

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test send hit', async () => {
    await defaultStrategy.sendHit({
      type: HitType.PAGE,
      documentLocation: 'localhost'
    })
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const SegmentHit = new Segment({
      context: { key: 'value' },
      visitorId: 'visitor-ID',
      anonymousId: null
    })
    await defaultStrategy.sendHit(SegmentHit)

    expect(sendTroubleshootingHit).toBeCalledTimes(1)
  })
})

describe('test DefaultStrategy troubleshootingHit', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  const addTroubleshootingHitSpy = jest.spyOn(trackingManager, 'addTroubleshootingHit')

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const murmurHash = new MurmurHash()
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true, emotionAi })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })
  const campaignDtoId = 'c2nrh1hjg50l9stringgu8bg'
  const campaignDTO = [
    {
      id: campaignDtoId,
      slug: 'slug',
      variationGroupId: 'id',
      variation: {
        id: '1dl',
        reference: false,
        modifications: {
          type: 'number',
          value: 12
        }
      }
    }
  ]
  it('test fetchFlags throw error here ', async () => {
    getCampaignsAsync.mockResolvedValue(campaignDTO)

    const extractFlagsMock = jest.spyOn(defaultStrategy as any, 'extractFlags')
    extractFlagsMock.mockImplementation(() => {
      throw new Error('error')
    })
    await defaultStrategy.fetchFlags()
    expect(addTroubleshootingHitSpy).toBeCalledTimes(1)
    const label: TroubleshootingLabel = TroubleshootingLabel.VISITOR_FETCH_CAMPAIGNS_ERROR
    expect(addTroubleshootingHitSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })
})

describe('test DefaultStrategy sendAnalyticHit', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'ca0594f5-4a37-4a7d-91be-27c63f829380'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  const sendUsageHitSpy = jest.spyOn(trackingManager, 'sendUsageHit')

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const FsInstanceId = 'FsInstanceId'
  const murmurHash = new MurmurHash()
  const murmurHash3Int32Spy = jest.spyOn(murmurHash, 'murmurHash3Int32')
  murmurHash3Int32Spy.mockReturnValue(1000)

  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    configManager,
    monitoringData: {
      instanceId: FsInstanceId,
      lastInitializationTimestamp: ''
    },
    hasConsented: true,
    emotionAi,
    murmurHash
  })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test fetchFlags', async () => {
    const campaignDTO = [
      {
        id: 'c2nrh1hjg50l9stringgu8bg',
        slug: 'slug',
        variationGroupId: 'id',
        variation: {
          id: '1dl',
          reference: false,
          modifications: {
            type: 'number',
            value: 12
          }
        }
      }
    ]

    getCampaignsAsync.mockResolvedValue(campaignDTO)

    await defaultStrategy.fetchFlags()

    expect(sendUsageHitSpy).toBeCalledTimes(1)

    const label: TroubleshootingLabel = TroubleshootingLabel.SDK_CONFIG
    expect(sendUsageHitSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test sendAnalyticHit when visitor traffic >', async () => {
    murmurHash3Int32Spy.mockReturnValue(100)

    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      configManager,
      monitoringData: {
        instanceId: FsInstanceId,
        lastInitializationTimestamp: ''
      },
      hasConsented: true,
      emotionAi,
      murmurHash
    })
    const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

    await defaultStrategy.sendSdkConfigAnalyticHit()

    expect(sendUsageHitSpy).toBeCalledTimes(0)
  })

  it('test sendAnalyticHit when disableDeveloperUsageTracking is true', async () => {
    config.disableDeveloperUsageTracking = true
    await defaultStrategy.sendSdkConfigAnalyticHit()

    expect(sendUsageHitSpy).toBeCalledTimes(0)
  })

  it('test sendUsageHit when disableDeveloperUsageTracking is true', async () => {
    config.disableDeveloperUsageTracking = true
    await defaultStrategy.sendUsageHit({} as UsageHit)

    expect(sendUsageHitSpy).toBeCalledTimes(0)
  })
})

describe('test DefaultStrategy with QA mode', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'ca0594f5-4a37-4a7d-91be-27c63f829380'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0 })
  config.logManager = logManager
  config.isQAModeEnabled = true

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const FsInstanceId = 'FsInstanceId'
  const murmurHash = new MurmurHash()
  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    configManager,
    monitoringData: {
      instanceId: FsInstanceId,
      lastInitializationTimestamp: ''
    },
    hasConsented: true,
    emotionAi
  })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })
  const returnMod = returnFlag.get('keyString') as FlagDTO

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  it('test visitorExposed', async () => {
    await defaultStrategy.visitorExposed({ key: returnMod.key, flag: returnMod, defaultValue: returnMod.value, hasGetValueBeenCalled: true })
    expect(activateFlag).toBeCalledTimes(1)
    const activateHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: returnMod.value,
      qaMode: true,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug,
        campaignName: returnMod.campaignName,
        variationGroupName: returnMod.variationGroupName,
        variationName: returnMod.variationName
      }
    })
    activateHit.config = config
    activateHit.visitorId = visitorId
    activateHit.ds = SDK_APP

    expect(activateFlag).toBeCalledWith(activateHit)
  })

  it('test sendHitAsync with literal object Event ', async () => {
    const hit = {
      type: HitType.EVENT,
      action: 'action_1',
      category: EventCategory.ACTION_TRACKING
    }
    await defaultStrategy.sendHit(hit)
    expect(addHit).toBeCalledTimes(1)
    expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config, qaMode: true }))
  })
})
