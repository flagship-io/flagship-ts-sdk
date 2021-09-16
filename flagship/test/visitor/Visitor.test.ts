import { jest, expect, it, describe } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config/index'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/NodeHttpClient'
import { IHttpResponse, IHttpOptions } from '../../src/utils/httpClient'
import { Mock } from 'jest-mock'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { Visitor } from '../../src/visitor/Visitor'
import { HitType, Modification } from '../../src'
import { EMIT_READY, SDK_LANGUAGE, SDK_VERSION } from '../../src/enum'
import { CampaignDTO } from '../../src/decision/api/models'

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

  const post: Mock<
    Promise<IHttpResponse>,
    [url: string, options: IHttpOptions]
  > = jest.fn()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, isAuthenticated: true })

  const visitor = new Visitor(visitorDelegate)

  const predefinedContext = {
    fs_client: SDK_LANGUAGE,
    fs_version: SDK_VERSION,
    fs_users: visitor.visitorId
  }

  it('test property', () => {
    expect(visitor.visitorId).toBe(visitorId)
    const newVisitorId = 'newVisitorId'
    visitor.visitorId = newVisitorId
    expect(visitor.visitorId).toBe(visitorDelegate.visitorId)
    expect(visitorDelegate.visitorId).toBe(newVisitorId)

    expect(visitor.anonymousId).toBe(visitorDelegate.anonymousId)

    expect(visitor.hasConsented).toBeFalsy()
    expect(visitor.hasConsented).toBe(visitorDelegate.hasConsented)

    visitor.setConsent(true)
    expect(visitorDelegate.hasConsented).toBeTruthy()
    expect(visitor.hasConsented).toBe(visitorDelegate.hasConsented)

    expect(visitor.config).toBe(config)

    expect(visitor.context).toEqual({ ...context, ...predefinedContext })

    visitorDelegate.modifications.set('newKey', new Modification('newKey', 'cma', 'var', 'varId', true, 'value'))

    expect(visitor.modifications).toBe(visitorDelegate.modifications)
  })

  it('test updateContext', () => {
    const newContexts = {
      isVip: false,
      hasChild: true
    }
    visitor.updateContext(newContexts)
    expect(visitor.context).toEqual({ ...newContexts, ...predefinedContext })
    expect(visitor.context).toEqual(visitorDelegate.context)
  })

  it('test clear context', () => {
    visitor.clearContext()
    expect(visitor.context).toEqual({})
    expect(visitor.context).toEqual(visitorDelegate.context)
  })

  it('test getModification', () => {
    const getModification = jest.spyOn(visitorDelegate, 'getModification')
    getModification.mockResolvedValue([])
    const param = { key: 'key', defaultValue: 'value' }
    visitor.getModification(param)
      .then(() => {
        expect(getModification).toBeCalledTimes(2)
        expect(getModification).toBeCalledWith(param, undefined)
      })
      .catch((error) => {
        console.log(error)
      })

    visitor.getModification(param, true)
      .then(() => {
        expect(getModification).toBeCalledTimes(2)
        expect(getModification).toBeCalledWith(param, true)
      })
      .catch((error) => {
        console.log(error)
      })
  })

  it('test getModifications', () => {
    const getModifications = jest.spyOn(visitorDelegate, 'getModifications')
    getModifications.mockResolvedValue([])
    const param = [{ key: 'key', defaultValue: 'value' }]
    visitor.getModifications(param)
      .then(() => {
        expect(getModifications).toBeCalledTimes(2)
        expect(getModifications).toBeCalledWith(param, undefined)
      })
      .catch((error) => {
        console.log(error)
      })

    visitor.getModifications(param, true)
      .then(() => {
        expect(getModifications).toBeCalledTimes(2)
        expect(getModifications).toBeCalledWith(param, true)
      })
      .catch((error) => {
        console.log(error)
      })
  })

  it('test getModificationSync', () => {
    const getModificationSync = jest.spyOn(visitorDelegate, 'getModificationSync')
    getModificationSync.mockReturnValue([])
    const param = { key: 'key', defaultValue: 'value' }
    visitor.getModificationSync(param)
    expect(getModificationSync).toBeCalledTimes(1)
    expect(getModificationSync).toBeCalledWith(param, undefined)
    visitor.getModificationSync(param, true)
    expect(getModificationSync).toBeCalledTimes(2)
    expect(getModificationSync).toBeCalledWith(param, true)
  })

  it('test getModificationsSync', () => {
    const getModificationsSync = jest.spyOn(visitorDelegate, 'getModificationsSync')
    getModificationsSync.mockReturnValue([])
    const param = [{ key: 'key', defaultValue: 'value' }]
    visitor.getModificationsSync(param)
    expect(getModificationsSync).toBeCalledTimes(1)
    expect(getModificationsSync).toBeCalledWith(param, undefined)
    visitor.getModificationsSync(param, true)
    expect(getModificationsSync).toBeCalledTimes(2)
    expect(getModificationsSync).toBeCalledWith(param, true)
  })

  it('test getModificationInfo', () => {
    const getModificationInfo = jest.spyOn(visitorDelegate, 'getModificationInfo')
    getModificationInfo.mockResolvedValue({} as Modification)
    visitor.getModificationInfo('key').then(() => {
      expect(getModificationInfo).toBeCalledTimes(1)
      expect(getModificationInfo).toBeCalledWith('key')
    })
  })

  it('test getModificationInfoSync', () => {
    const getModificationInfoSync = jest.spyOn(visitorDelegate, 'getModificationInfoSync')
    getModificationInfoSync.mockReturnValue({} as Modification)
    visitor.getModificationInfoSync('key')
    expect(getModificationInfoSync).toBeCalledTimes(1)
    expect(getModificationInfoSync).toBeCalledWith('key')
  })

  it('test synchronizeModifications', () => {
    const synchronizeModifications = jest.spyOn(visitorDelegate, 'synchronizeModifications')
    synchronizeModifications.mockResolvedValue()
    visitor.synchronizeModifications()
      .then(() => {
        expect(synchronizeModifications).toBeCalledTimes(1)
      })
  })

  it('test activateModification', () => {
    const activateModification = jest.spyOn(visitorDelegate, 'activateModification')
    activateModification.mockResolvedValue()
    visitor.activateModification('key').then(() => {
      expect(activateModification).toBeCalledTimes(1)
      expect(activateModification).toBeCalledWith('key')
    })
  })

  it('test activateModifications', () => {
    const activateModifications = jest.spyOn(visitorDelegate, 'activateModifications')
    activateModifications.mockResolvedValue()
    visitor.activateModifications(['key']).then(() => {
      expect(activateModifications).toBeCalledTimes(1)
      expect(activateModifications).toBeCalledWith(['key'])
    })
  })

  it('test activateModificationSync', () => {
    const activateModificationSync = jest.spyOn(visitorDelegate, 'activateModificationSync')
    activateModificationSync.mockReturnValue()
    visitor.activateModificationSync('key')
    expect(activateModificationSync).toBeCalledTimes(1)
    expect(activateModificationSync).toBeCalledWith('key')
  })

  it('test activateModificationsSync', () => {
    const activateModificationsSync = jest.spyOn(visitorDelegate, 'activateModificationsSync')
    activateModificationsSync.mockReturnValue()
    visitor.activateModificationsSync(['key'])
    expect(activateModificationsSync).toBeCalledTimes(1)
    expect(activateModificationsSync).toBeCalledWith(['key'])
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

  it('test sendHitSync', () => {
    const sendHitSync = jest.spyOn(visitorDelegate, 'sendHitSync')
    sendHitSync.mockReturnValue()
    const page = { type: HitType.PAGE, documentLocation: 'home' }
    visitor.sendHitSync(page)
    expect(sendHitSync).toBeCalledTimes(1)
    expect(sendHitSync).toBeCalledWith(page)
  })

  it('test getAllModifications', () => {
    const getAllModifications = jest.spyOn(visitorDelegate, 'getAllModifications')
    getAllModifications.mockResolvedValue({ visitorId: 'visitorId', campaigns: {} as CampaignDTO [] })
    visitor.getAllModifications().then(() => {
      expect(getAllModifications).toBeCalledTimes(1)
    })
  })

  it('test getModificationsForCampaign', () => {
    const getModificationsForCampaign = jest.spyOn(visitorDelegate, 'getModificationsForCampaign')
    getModificationsForCampaign.mockResolvedValue({ visitorId: 'visitorId', campaigns: {} as CampaignDTO [] })
    const campaignId = 'campaignId'
    visitor.getModificationsForCampaign(campaignId).then(() => {
      expect(getModificationsForCampaign).toBeCalledTimes(1)
      expect(getModificationsForCampaign).toBeCalledWith(campaignId, false)
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
})
