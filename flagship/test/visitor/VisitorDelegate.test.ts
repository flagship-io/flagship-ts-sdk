import { CampaignDTO, EAIScore, FlagsStatus, SerializedFlagMetadata, primitive } from './../../src/types'
import { jest, expect, it, describe } from '@jest/globals'
import { FlagDTO } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { HitType, VISITOR_ID_ERROR } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { IFSFlagMetadata, IHit } from '../../src/types'
import { DecisionManager } from '../../src/decision/DecisionManager'
import { FSFetchStatus } from '../../src/enum/FSFetchStatus'
import { FSFetchReasons } from '../../src/enum/FSFetchReasons'
import { FSFlagCollection } from '../../src/flag/FSFlagCollection'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI'
import { IPageView } from '../../src/emotionAI/hit/IPageView'
import { IVisitorEvent } from '../../src/emotionAI/hit/IVisitorEvent'
import { VisitorProfileCacheNode } from '../../src/visitor/VisitorProfileCacheNode'
import { Event, EventCategory } from '../../src/hit'

const updateContext = jest.fn()
const clearContext = jest.fn()
const fetchFlags = jest.fn<()=>Promise<void>>()

const getFlagMetadata = jest.fn<(metadata:IFSFlagMetadata)=>IFSFlagMetadata>()
const sendHit = jest.fn<(hit: IHit)=> Promise<void>>()

const sendHits = jest.fn<(hit: IHit[])=>Promise<void>>()
const sendHitsSync = jest.fn<(hit: IHit[])=>void>()

const authenticate = jest.fn<(visitorId:string)=>void>()
const unauthenticate = jest.fn<()=>void>()
const setConsent = jest.fn<(hasConsented: boolean)=>void>()

const updateCampaigns = jest.fn<(campaigns: CampaignDTO[])=>void>()
const lookupVisitor = jest.fn<()=>void>()
const lookupHits = jest.fn()
const cacheVisitorFn = jest.fn<()=>Promise<void>>()
const visitorExposed = jest.fn<(param:{key:string, flag?:FlagDTO, defaultValue:unknown})=>Promise<void>>()
const getFlagValue = jest.fn<(param:{ key:string, defaultValue: unknown, flag?:FlagDTO, userExposed?: boolean})=>unknown>()
const collectEAIEventsAsync = jest.fn<(currentPage?: Omit<IPageView, 'toApiKeys'>) => Promise<void>>()
const reportEaiVisitorEvent = jest.fn<(event: IVisitorEvent) => Promise<void>>()
const reportEaiPageView = jest.fn<(pageView: IPageView) => Promise<void>>()
const onEAICollectStatusChange = jest.fn<(callback: (status: boolean) => void) => void>()
const cleanup = jest.fn<() => void>()
const addInTrackingManager = jest.fn()

jest.mock('../../src/visitor/DefaultStrategy', () => {
  return {
    DefaultStrategy: jest.fn().mockImplementation(() => {
      return {
        setConsent,
        updateContext,
        clearContext,
        sendHit,
        sendHits,
        sendHitsSync,
        authenticate,
        unauthenticate,
        updateCampaigns,
        lookupVisitor,
        lookupHits,
        fetchFlags,
        getFlagMetadata,
        cacheVisitor: cacheVisitorFn,
        visitorExposed,
        getFlagValue,
        collectEAIEventsAsync,
        reportEaiVisitorEvent,
        reportEaiPageView,
        onEAICollectStatusChange,
        cleanup,
        addInTrackingManager
      }
    })
  }
})

describe('test VisitorDelegate', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: Record<string, primitive> = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

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

  const OnFlagStatusChanged = jest.fn<({ status, reason }: FlagsStatus) => void>()

  const init = jest.fn<(visitor:VisitorAbstract) => void>()
  const collectEAIData = jest.fn<() => Promise<EAIScore|undefined>>

  const emotionAi = {
    init,
    collectEAIData
  } as unknown as IEmotionAI

  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    configManager: configManager as ConfigManager,
    initialCampaigns: campaigns,
    hasConsented: true,
    emotionAi
  })

  expect(updateContext).toBeCalledTimes(1)
  expect(updateContext).toBeCalledWith(context, undefined)
  expect(updateCampaigns).toBeCalledTimes(1)
  expect(updateCampaigns).toBeCalledWith(campaigns)

  it('should test visitorId', () => {
    expect(visitorDelegate.visitorId).toBe(visitorId)
    const newVisitorId = 'newVisitorId'
    visitorDelegate.visitorId = newVisitorId
    expect(visitorDelegate.visitorId).toBe(newVisitorId)

    visitorDelegate.visitorId = {} as string

    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(VISITOR_ID_ERROR, 'VISITOR ID')
  })

  it('should test empty visitorId', () => {
    const visitorDelegate = new VisitorDelegate({ context, configManager, hasConsented: true, emotionAi })
    expect(visitorDelegate.visitorId).toBeDefined()
    expect(visitorDelegate.visitorId).toHaveLength(36)
  })

  it('test context', () => {
    const newContext = {
      IsVip: false,
      hasChild: true
    }
    visitorDelegate.context = newContext
    expect(updateContext).toBeCalledTimes(1)
    expect(updateContext).toBeCalledWith(newContext, undefined)
  })

  it('should test flagsData', () => {
    expect(visitorDelegate.flagsData.size).toBe(0)
    const flag = {
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      value: 'value',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    }
    const newFlag = new Map([['key', flag]])
    visitorDelegate.flagsData = newFlag
    expect(visitorDelegate.flagsData).toEqual(newFlag)
    visitorDelegate.flagsData.clear()
  })

  it('test campaigns', () => {
    expect(visitorDelegate.campaigns).toHaveLength(0)
    const campaigns = [
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
      }]

    visitorDelegate.campaigns = campaigns
    expect(visitorDelegate.campaigns).toBe(campaigns)
  })

  it('test onFetchFlagsStatusChanged callback', () => {
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      configManager: configManager as ConfigManager,
      initialCampaigns: campaigns,
      hasConsented: true,
      onFlagsStatusChanged: OnFlagStatusChanged,
      emotionAi
    })
    expect(visitorDelegate.onFetchFlagsStatusChanged).toBe(OnFlagStatusChanged)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledTimes(1)
    expect(visitorDelegate.onFetchFlagsStatusChanged).toBeCalledWith({
      status: FSFetchStatus.FETCH_REQUIRED,
      reason: FSFetchReasons.FLAGS_NEVER_FETCHED
    })
  })

  it('test property', () => {
    expect(visitorDelegate.hasConsented).toBeTruthy()

    expect(visitorDelegate.config).toBe(config)

    expect(visitorDelegate.configManager).toBe(configManager)

    expect(visitorDelegate.anonymousId).toBeNull()

    visitorDelegate.flagsData.set('newKey', {
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      value: 'value',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    })
  })

  it('test anonymous', () => {
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      isAuthenticated: true,
      context,
      configManager: configManager as ConfigManager,
      hasConsented: true,
      emotionAi
    })
    expect(visitorDelegate.anonymousId).toBeDefined()
    expect(visitorDelegate.anonymousId).toHaveLength(36)
  })
})

describe('test VisitorDelegate methods', () => {
  const logManager = new FlagshipLogManager()
  const logWarning = jest.spyOn(logManager, 'warning')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const init = jest.fn<(visitor:VisitorAbstract) => void>()

  const emotionAi = {
    init
  } as unknown as IEmotionAI

  const visitorDelegate = new VisitorDelegate({
    visitorId: 'visitorId',
    context: {},
    configManager: { config, decisionManager: {} as DecisionManager, trackingManager: {} as TrackingManager },
    hasConsented: true,
    emotionAi
  })

  it('test setConsent', () => {
    visitorDelegate.setConsent(true)
    expect(setConsent).toBeCalledTimes(1)
    expect(setConsent).toBeCalledWith(true)
  })

  it('test updateContext', () => {
    const contexts = {
      isVip: false
    }
    visitorDelegate.updateContext(contexts)
    expect(updateContext).toBeCalledTimes(1)
    expect(updateContext).toBeCalledWith(contexts, undefined)
  })

  it('test updateContext key/value', () => {
    visitorDelegate.updateContext('isVip', false)
    expect(updateContext).toBeCalledTimes(1)
    expect(updateContext).toBeCalledWith('isVip', false)
  })

  it('test clear', () => {
    visitorDelegate.clearContext()
    expect(clearContext).toBeCalledTimes(1)
  })

  it('test addInTrackingManager', () => {
    const eventHit = new Event({
      visitorId: 'visitorId',
      category: EventCategory.ACTION_TRACKING,
      action: 'action',
      label: 'label'
    })
    visitorDelegate.addInTrackingManager(eventHit)
    expect(addInTrackingManager).toBeCalledTimes(1)
    expect(addInTrackingManager).toBeCalledWith(eventHit)
  })

  it('test getFlag', () => {
    const flagDTO = {
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      value: 'value',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName',
      campaignType: 'ab'
    }

    getFlagMetadata.mockReturnValue({
      campaignId: flagDTO.campaignId,
      variationGroupId: flagDTO.variationGroupId,
      variationId: flagDTO.variationId,
      isReference: flagDTO.isReference,
      campaignType: flagDTO.campaignType,
      campaignName: flagDTO.campaignName,
      variationGroupName: flagDTO.variationGroupName,
      variationName: flagDTO.variationName
    })

    visitorDelegate.fetchStatus = { status: FSFetchStatus.FETCHED, reason: FSFetchReasons.NONE }

    visitorDelegate.flagsData.set('newKey', flagDTO)
    let flag = visitorDelegate.getFlag('newKey')

    expect(flag).toBeDefined()
    expect(flag.exists()).toBeTruthy()
    expect(flag.metadata).toEqual(expect.objectContaining({
      campaignId: flagDTO.campaignId,
      variationGroupId: flagDTO.variationGroupId,
      variationId: flagDTO.variationId,
      isReference: flagDTO.isReference,
      campaignType: flagDTO.campaignType,
      campaignName: flagDTO.campaignName,
      variationGroupName: flagDTO.variationGroupName,
      variationName: flagDTO.variationName
    }))

    visitorDelegate.fetchStatus = { status: FSFetchStatus.FETCH_REQUIRED, reason: FSFetchReasons.AUTHENTICATE }
    flag = visitorDelegate.getFlag('newKey')
    expect(logWarning).toBeCalledTimes(1)
  })

  it('test getFlags', () => {
    const flags = visitorDelegate.getFlags()
    expect(flags).toBeInstanceOf(FSFlagCollection)
    expect(flags.size).toBe(1)
  })

  it('test fetchFlags', () => {
    fetchFlags.mockResolvedValue()
    cacheVisitorFn.mockResolvedValue()
    visitorDelegate.fetchFlags()
      .then(() => {
        expect(fetchFlags).toBeCalledTimes(1)
      }).catch(err => expect(err).toBeNull())
  })

  it('test userExposed', () => {
    visitorExposed.mockResolvedValue()
    const params = { key: 'key', flag: undefined, defaultValue: 'defaultValue', hasGetValueBeenCalled: true }
    visitorDelegate.visitorExposed(params)
      .then(() => {
        expect(visitorExposed).toBeCalledTimes(1)
        expect(visitorExposed).toBeCalledWith(params)
      }).catch(err => expect(err).toBeNull())
  })

  it('test getFlagValue', () => {
    const flagValue = 'value'
    getFlagValue.mockReturnValue(flagValue)
    const params = { key: 'key', flag: undefined, defaultValue: 'defaultValue' }
    const value = visitorDelegate.getFlagValue(params)
    expect(getFlagValue).toBeCalledTimes(1)
    expect(getFlagValue).toBeCalledWith(params)
    expect(value).toBe(flagValue)
  })

  it('test sendHit', () => {
    sendHit.mockResolvedValue()
    const page = { type: HitType.PAGE, documentLocation: 'home' }
    visitorDelegate.sendHit(page).then(() => {
      expect(sendHit).toBeCalledTimes(1)
      expect(sendHit).toBeCalledWith(page)
    })
  })

  it('test sendHits', () => {
    sendHits.mockResolvedValue()
    const page = [{ type: HitType.PAGE, documentLocation: 'home' }]
    visitorDelegate.sendHits(page).then(() => {
      expect(sendHits).toBeCalledTimes(1)
      expect(sendHits).toBeCalledWith(page)
    })
  })

  it('test authenticate', () => {
    authenticate.mockReturnValue()
    const authenticateId = 'authenticateId'
    visitorDelegate.authenticate(authenticateId)
    expect(authenticate).toBeCalledTimes(1)
    expect(authenticate).toBeCalledWith(authenticateId)
  })

  it('test unauthenticate', () => {
    unauthenticate.mockReturnValue()
    visitorDelegate.unauthenticate()
    expect(unauthenticate).toBeCalledTimes(1)
  })

  it('test collectEAIData', async () => {
    collectEAIEventsAsync.mockResolvedValue()
    await visitorDelegate.collectEAIEventsAsync()
    expect(collectEAIEventsAsync).toBeCalledTimes(1)
    expect(collectEAIEventsAsync).toBeCalledWith(undefined)
  })

  it('test collectEAIData', async () => {
    collectEAIEventsAsync.mockResolvedValue()
    const currentPage = {} as IPageView
    await visitorDelegate.collectEAIEventsAsync(currentPage)
    expect(collectEAIEventsAsync).toBeCalledTimes(1)
    expect(collectEAIEventsAsync).toBeCalledWith(currentPage)
  })

  it('test reportEaiVisitorEvent', () => {
    reportEaiVisitorEvent.mockResolvedValue()
    const event = {} as IVisitorEvent
    visitorDelegate.sendEaiVisitorEvent(event)
    expect(reportEaiVisitorEvent).toBeCalledTimes(1)
    expect(reportEaiVisitorEvent).toBeCalledWith(event)
  })

  it('test reportEaiPageView', () => {
    reportEaiPageView.mockResolvedValue()
    const pageView = {} as IPageView
    visitorDelegate.sendEaiPageView(pageView)
    expect(reportEaiPageView).toBeCalledTimes(1)
    expect(reportEaiPageView).toBeCalledWith(pageView)
  })

  it('test onEAICollectStatusChange', () => {
    const callback = jest.fn()
    onEAICollectStatusChange.mockReturnValue()
    visitorDelegate.onEAICollectStatusChange(callback)
    expect(onEAICollectStatusChange).toBeCalledTimes(1)
    expect(onEAICollectStatusChange).toBeCalledWith(callback)
  })

  it('test cleanup', () => {
    cleanup.mockReturnValue()
    visitorDelegate.cleanup()
    expect(cleanup).toBeCalledTimes(1)
  })

  it('test getCachedEAIScore', async () => {
    const score = await visitorDelegate.getCachedEAIScore()
    expect(score).toBeUndefined()
    expect(lookupVisitor).toBeCalledTimes(1)
  })

  it('test getCachedEAIScore', async () => {
    visitorDelegate.visitorCache = {
      version: 1,
      data: {
        visitorId: 'visitorId',
        anonymousId: 'anonymousId',
        eAIScore: {
          eai: {
            eas: 'eas'
          }
        }
      }
    }
    const score = await visitorDelegate.getCachedEAIScore()
    expect(score).toEqual({ eai: { eas: 'eas' } })
    expect(lookupVisitor).toBeCalledTimes(0)
  })

  it('test setCachedEAIScore', () => {
    const score = { eai: { eas: 'eas' } }
    visitorDelegate.setCachedEAIScore(score)
    expect(cacheVisitorFn).toBeCalledTimes(1)
    expect(cacheVisitorFn).toBeCalledWith(score)
  })

  it('test isEAIDataCollected', async () => {
    visitorDelegate.visitorCache = undefined
    const isEAIDataCollected = await visitorDelegate.isEAIDataCollected()
    expect(isEAIDataCollected).toBeFalsy()
    expect(lookupVisitor).toBeCalledTimes(1)
  })

  it('test isEAIDataCollected', async () => {
    visitorDelegate.visitorCache = {
      version: 1,
      data: {
        visitorId: 'visitorId',
        anonymousId: 'anonymousId',
        isEAIDataCollected: true
      }
    }
    const isEAIDataCollected = await visitorDelegate.isEAIDataCollected()
    expect(isEAIDataCollected).toBeTruthy()
    expect(lookupVisitor).toBeCalledTimes(0)
  })

  it('test setIsEAIDataCollected', () => {
    visitorDelegate.setIsEAIDataCollected(true)
    expect(cacheVisitorFn).toBeCalledTimes(1)
    expect(cacheVisitorFn).toBeCalledWith(undefined, true)
  })
})

describe('Initialization tests', () => {
  const config = new DecisionApiConfig()
  config.reuseVisitorIds = true

  const visitorId = 'visitorId'
  const anonymousId = 'anonymousId'

  const visitorProfileCache = new VisitorProfileCacheNode(config)
  const loadVisitorProfile = jest.spyOn(visitorProfileCache, 'loadVisitorProfile')

  const init = jest.fn<(visitor:VisitorAbstract) => void>()

  const emotionAi = {
    init
  } as unknown as IEmotionAI

  it('should initialize visitorDelegate with anonymousId', () => {
    loadVisitorProfile.mockReturnValue({ visitorId, anonymousId })
    const visitorDelegate = new VisitorDelegate({
      context: {},
      configManager: {
        config,
        decisionManager: {} as DecisionManager,
        trackingManager: {} as TrackingManager
      },
      visitorProfileCache,
      hasConsented: true,
      emotionAi
    })
    expect(visitorDelegate.visitorId).toBe(anonymousId)
    expect(visitorDelegate.anonymousId).toBeNull()
  })

  it('should initialize visitorDelegate with authenticated visitorId and anonymousId', () => {
    loadVisitorProfile.mockReturnValue({ visitorId, anonymousId })
    const visitorDelegate = new VisitorDelegate({
      context: {},
      isAuthenticated: true,
      configManager: {
        config,
        decisionManager: {} as DecisionManager,
        trackingManager: {} as TrackingManager
      },
      visitorProfileCache,
      hasConsented: true,
      emotionAi
    })
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBe(anonymousId)
  })
  it('should initialize visitorDelegate with authenticated visitorId and generate anonymousId', () => {
    loadVisitorProfile.mockReturnValue({ visitorId, anonymousId: null })
    const visitorDelegate = new VisitorDelegate({
      context: {},
      isAuthenticated: true,
      configManager: {
        config,
        decisionManager: {} as DecisionManager,
        trackingManager: {} as TrackingManager
      },
      visitorProfileCache,
      hasConsented: true,
      emotionAi
    })
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBeDefined()
  })

  it('should initialize visitorDelegate with authenticated visitorId and null anonymousId', () => {
    loadVisitorProfile.mockReturnValue({ visitorId, anonymousId: null })
    const visitorDelegate = new VisitorDelegate({
      context: {},
      configManager: {
        config,
        decisionManager: {} as DecisionManager,
        trackingManager: {} as TrackingManager
      },
      visitorProfileCache,
      hasConsented: true,
      emotionAi
    })
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBeNull()
  })
})

describe('test initialFlagsData', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const init = jest.fn<(visitor:VisitorAbstract) => void>()

  const emotionAi = {
    init
  } as unknown as IEmotionAI

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

  it('should initialize flagsData', () => {
    const initialFlagsData:SerializedFlagMetadata[] = [{
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      hex: '7b2276223a2276616c756531227d',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName',
      slug: 'slug',
      campaignType: 'ab'
    }]
    const flagsData = new Map<string, FlagDTO>()
    flagsData.set('newKey', {
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      value: 'value1',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName',
      campaignType: 'ab',
      slug: 'slug'
    })
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      configManager: configManager as ConfigManager,
      initialCampaigns: campaigns,
      initialFlagsData,
      hasConsented: true,
      emotionAi
    })

    expect(visitorDelegate.flagsData).toEqual(flagsData)
  })

  it('should initialize flagsData with empty Array', () => {
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      configManager: configManager as ConfigManager,
      initialCampaigns: campaigns,
      initialFlagsData: [] as [],
      hasConsented: true,
      emotionAi
    })

    expect(visitorDelegate.flagsData.size).toBe(0)
  })
})
