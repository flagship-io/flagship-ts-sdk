import { jest, expect, it, describe } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config/index'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { IHttpResponse, IHttpOptions, HttpClient } from '../../src/utils/HttpClient'
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

    expect(visitor.hasConsented).toBeTruthy()
    expect(visitor.hasConsented).toBe(visitorDelegate.hasConsented)

    visitor.setConsent(true)
    expect(visitorDelegate.hasConsented).toBeTruthy()
    expect(visitor.hasConsented).toBe(visitorDelegate.hasConsented)

    expect(visitor.config).toBe(config)

    expect(visitor.context).toEqual({ ...context, ...predefinedContext })

    visitorDelegate.modifications.set('newKey', {
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      value: 'value'
    })

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
        expect(getModification).toBeCalledWith(param)
      })
      .catch((error) => {
        console.log(error)
      })

    visitor.getModification(param)
      .then(() => {
        expect(getModification).toBeCalledTimes(2)
        expect(getModification).toBeCalledWith(param)
      })
      .catch((error) => {
        console.log(error)
      })
  })

  it('test getModificationsArray', () => {
    const getModifications = jest.spyOn(visitorDelegate, 'getModificationsArray')
    getModifications.mockReturnValue([])
    visitor.getModificationsArray()
    expect(getModifications).toBeCalledTimes(1)
  })

  it('test getModifications', () => {
    const getModifications = jest.spyOn(visitorDelegate, 'getModifications')
    getModifications.mockResolvedValue({})
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
    expect(getModificationSync).toBeCalledWith(param)
    visitor.getModificationSync(param)
    expect(getModificationSync).toBeCalledTimes(2)
    expect(getModificationSync).toBeCalledWith(param)
  })

  it('test getModificationsSync', () => {
    const getModificationsSync = jest.spyOn(visitorDelegate, 'getModificationsSync')
    getModificationsSync.mockReturnValue({})
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

  it('test fetchFlags', () => {
    const fetchFlags = jest.spyOn(visitorDelegate, 'fetchFlags')
    fetchFlags.mockResolvedValue()
    visitor.fetchFlags()
      .then(() => {
        expect(fetchFlags).toBeCalledTimes(1)
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

  it('test getAllModifications', () => {
    const getAllModifications = jest.spyOn(visitorDelegate, 'getAllModifications')
    getAllModifications.mockResolvedValue({ visitorId: 'visitorId', campaigns: {} as CampaignDTO [] })
    visitor.getAllModifications().then(() => {
      expect(getAllModifications).toBeCalledTimes(2)
      expect(getAllModifications).toBeCalledWith(false)
    })
    visitor.getAllModifications(true).then(() => {
      expect(getAllModifications).toBeCalledTimes(2)
      expect(getAllModifications).toBeCalledWith(true)
    })
  })

  it('test getModificationsForCampaign', () => {
    const getModificationsForCampaign = jest.spyOn(visitorDelegate, 'getModificationsForCampaign')
    getModificationsForCampaign.mockResolvedValue({ visitorId: 'visitorId', campaigns: {} as CampaignDTO [] })
    const campaignId = 'campaignId'
    visitor.getModificationsForCampaign(campaignId).then(() => {
      expect(getModificationsForCampaign).toBeCalledTimes(2)
      expect(getModificationsForCampaign).toBeCalledWith(campaignId, false)
    })

    visitor.getModificationsForCampaign(campaignId, true).then(() => {
      expect(getModificationsForCampaign).toBeCalledTimes(2)
      expect(getModificationsForCampaign).toBeCalledWith(campaignId, true)
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
