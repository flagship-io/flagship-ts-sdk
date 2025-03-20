import { jest, expect, it, describe } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config/index'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { IHttpResponse, HttpClient } from '../../src/utils/HttpClient'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { Visitor } from '../../src/visitor/Visitor'
import { HitType, IFSFlagCollection } from '../../src'
import { EMIT_READY, SDK_INFO } from '../../src/enum'
import { IFSFlag } from '../../src/flag/IFSFlag'
import { FSFetchStatus } from '../../src/enum/FSFetchStatus'
import { FSFetchReasons } from '../../src/enum/FSFetchReasons'
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'
import { IPageView } from '../../src/emotionAI/hit/IPageView'
import { IVisitorEvent } from '../../src/emotionAI/hit/IVisitorEvent'

describe('test visitor', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const init = jest.fn<(visitor:VisitorAbstract) => void>()

  const emotionAi = {
    init
  } as unknown as IEmotionAI

  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    configManager,
    isAuthenticated: true,
    hasConsented: true,
    emotionAi
  })

  const visitor = new Visitor(visitorDelegate)

  expect(emotionAi.init).toBeCalledTimes(1)
  expect(emotionAi.init).toBeCalledWith(visitorDelegate)

  const predefinedContext = {
    fs_client: SDK_INFO.name,
    fs_version: SDK_INFO.version,
    fs_users: visitor.visitorId
  }
  const newVisitorId = 'newVisitorId'

  it('test property', () => {
    expect(visitor.visitorId).toBe(visitorId)

    visitor.visitorId = newVisitorId
    expect(visitor.visitorId).toBe(visitorDelegate.visitorId)
    expect(visitorDelegate.visitorId).toBe(newVisitorId)

    expect(visitor.anonymousId).toBe(visitorDelegate.anonymousId)

    expect(visitor.hasConsented).toBeTruthy()
    expect(visitor.hasConsented).toBe(visitorDelegate.hasConsented)

    visitor.setConsent(true)
    expect(visitorDelegate.hasConsented).toBeTruthy()
    expect(visitor.hasConsented).toBe(visitorDelegate.hasConsented)

    expect(visitor.config).toBe(config)

    expect(visitor.context).toEqual({ ...context, ...predefinedContext, fs_users: newVisitorId })
  })

  it('test updateContext', () => {
    const newContexts = {
      isVip: false,
      hasChild: true
    }
    visitor.updateContext(newContexts)
    expect(visitor.context).toEqual({ ...newContexts, ...predefinedContext, fs_users: newVisitorId })
    expect(visitor.context).toEqual(visitorDelegate.context)
  })

  it('test clear context', () => {
    visitor.clearContext()
    expect(visitor.context).toEqual({ ...predefinedContext, fs_users: newVisitorId })
    expect(visitor.context).toEqual(visitorDelegate.context)
  })

  it('test fetchStatus', () => {
    visitorDelegate.flagsStatus = {
      status: FSFetchStatus.FETCHED,
      reason: FSFetchReasons.NONE
    }
    expect(visitor.flagsStatus).toEqual(visitorDelegate.flagsStatus)
  })

  it('test getFlag', () => {
    const getFlag = jest.spyOn(visitorDelegate, 'getFlag')
    getFlag.mockReturnValue({} as IFSFlag)
    visitor.getFlag('key')
    expect(getFlag).toBeCalledTimes(1)
    expect(getFlag).toBeCalledWith('key')
  })

  it('test getFlags', () => {
    const getFlags = jest.spyOn(visitorDelegate, 'getFlags')
    getFlags.mockReturnValue({} as IFSFlagCollection)
    visitor.getFlags()
    expect(getFlags).toBeCalledTimes(1)
  })

  it('test fetchFlags', () => {
    const fetchFlags = jest.spyOn(visitorDelegate, 'fetchFlags')
    fetchFlags.mockResolvedValue()
    visitor.fetchFlags()
      .then(() => {
        expect(fetchFlags).toBeCalledTimes(1)
      })
  })

  it('test sendHit', () => {
    const sendHit = jest.spyOn(visitorDelegate, 'sendHit')
    sendHit.mockResolvedValue()
    const page = { type: HitType.PAGE, documentLocation: 'home' }
    visitor.sendHit(page).then(() => {
      expect(sendHit).toBeCalledTimes(1)
      expect(sendHit).toBeCalledWith(page)
    })
  })

  it('test sendHits', () => {
    const sendHits = jest.spyOn(visitorDelegate, 'sendHits')
    sendHits.mockResolvedValue()
    const page = [{ type: HitType.PAGE, documentLocation: 'home' }]
    visitor.sendHits(page).then(() => {
      expect(sendHits).toBeCalledTimes(1)
      expect(sendHits).toBeCalledWith(page)
    })
  })

  it('test authenticate', () => {
    const authenticate = jest.spyOn(visitorDelegate, 'authenticate')
    authenticate.mockReturnValue()
    const authenticateId = 'authenticateId'
    visitor.authenticate(authenticateId)
    expect(authenticate).toBeCalledTimes(1)
    expect(authenticate).toBeCalledWith(authenticateId)
  })

  it('test unauthenticate', () => {
    const unauthenticate = jest.spyOn(visitorDelegate, 'unauthenticate')
    unauthenticate.mockReturnValue()
    visitor.unauthenticate()
    expect(unauthenticate).toBeCalledTimes(1)
  })

  it('test listener ', () => {
    const args = {}
    visitor.on(EMIT_READY, (params) => {
      expect(params).toEqual(args)
    })
    visitorDelegate.emit(EMIT_READY, args)
  })

  it('test collectEAIData', () => {
    const collectEAIData = jest.spyOn(visitorDelegate, 'collectEAIEventsAsync')
    collectEAIData.mockResolvedValue()
    visitor.collectEAIEventsAsync()
    expect(collectEAIData).toBeCalledTimes(1)
    expect(collectEAIData).toBeCalledWith(undefined)
  })

  it('test collectEAIData', () => {
    const collectEAIData = jest.spyOn(visitorDelegate, 'collectEAIEventsAsync')
    collectEAIData.mockResolvedValue()
    const currentPage = {} as IPageView
    visitor.collectEAIEventsAsync(currentPage)
    expect(collectEAIData).toBeCalledTimes(1)
    expect(collectEAIData).toBeCalledWith(currentPage)
  })

  it('test cleanup', () => {
    const cleanup = jest.spyOn(visitorDelegate, 'cleanup')
    cleanup.mockReturnValue()
    visitor.cleanup()
    expect(cleanup).toBeCalledTimes(1)
  })

  it('test sendEaiVisitorEvent', () => {
    const sendEaiVisitorEvent = jest.spyOn(visitorDelegate, 'sendEaiVisitorEvent')
    sendEaiVisitorEvent.mockReturnValue()
    const event = {} as IVisitorEvent
    (visitor as any).sendEaiVisitorEvent(event)
    expect(sendEaiVisitorEvent).toBeCalledTimes(1)
    expect(sendEaiVisitorEvent).toBeCalledWith(event)
  })

  it('test sendEaiPageView', () => {
    const sendEaiPageView = jest.spyOn(visitorDelegate, 'sendEaiPageView')
    sendEaiPageView.mockReturnValue()
    const pageView = {} as IPageView
    (visitor as any).sendEaiPageView(pageView)
    expect(sendEaiPageView).toBeCalledTimes(1)
    expect(sendEaiPageView).toBeCalledWith(pageView)
  })

  it('test onEAICollectStatusChange', () => {
    const onEAICollectStatusChange = jest.spyOn(visitorDelegate, 'onEAICollectStatusChange')
    onEAICollectStatusChange.mockReturnValue()
    const callback = jest.fn<(status: boolean) => void>();
    (visitor as any).onEAICollectStatusChange(callback)
    expect(onEAICollectStatusChange).toBeCalledTimes(1)
    expect(onEAICollectStatusChange).toBeCalledWith(callback)
  })
})
