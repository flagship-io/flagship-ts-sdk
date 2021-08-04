import { jest, expect, it, describe } from '@jest/globals'
import { Modification } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { HitType, VISITOR_ID_ERROR } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/NodeHttpClient'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { Mock } from 'jest-mock'
import { modificationsRequested } from '../../src/types'
import { IEvent, IItem, IPage, IScreen, ITransaction } from '../../src/hit'
import { CampaignDTO } from '../../src/decision/api/models'

const updateContext = jest.fn()
const clearContext = jest.fn()
const getModification:Mock<Promise<unknown[]>, [params: modificationsRequested<unknown>[], activateAll?: boolean]> = jest.fn()
const getModificationSync = jest.fn()
const getModificationInfo:Mock<Promise<Modification>, [key: string]> = jest.fn()
const getModificationInfoSync = jest.fn()
const synchronizeModifications:Mock<Promise<void>, []> = jest.fn()
const activateModification:Mock<Promise<void>, [keys: string[]]> = jest.fn()
const activateModificationSync:Mock<void, [keys: string[]]> = jest.fn()
const sendHit:Mock<Promise<void>, [hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]]> = jest.fn()
const sendHitSync:Mock<void, [hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]]> = jest.fn()
const getAllModifications:Mock<Promise<{
  visitorId: string;
  campaigns: CampaignDTO[];
}>, [activate: boolean]> = jest.fn()
const getModificationsForCampaign:Mock<Promise<{
  visitorId: string;
  campaigns: CampaignDTO[];
}>, [campaignId: string, activate?: boolean]> = jest.fn()

jest.mock('../../src/visitor/DefaultStrategy', () => {
  return {
    DefaultStrategy: jest.fn().mockImplementation(() => {
      return {
        updateContext,
        clearContext,
        getModification,
        getModificationSync,
        getModificationInfo,
        getModificationInfoSync,
        synchronizeModifications,
        activateModification,
        activateModificationSync,
        sendHit,
        sendHitSync,
        getAllModifications,
        getModificationsForCampaign
      }
    })
  }
})

describe('test VisitorDelegate', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
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

  const visitorDelegate = new VisitorDelegate(visitorId, context, configManager as ConfigManager)
  expect(updateContext).toBeCalledWith(context)
  expect(updateContext).toBeCalledTimes(1)

  it('test visitorId', () => {
    expect(visitorDelegate.visitorId).toBe(visitorId)
    const newVisitorId = 'newVisitorId'
    visitorDelegate.visitorId = newVisitorId
    expect(visitorDelegate.visitorId).toBe(newVisitorId)

    visitorDelegate.visitorId = {} as string

    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(VISITOR_ID_ERROR, 'VISITOR ID')
  })

  it('test empty visitorId', () => {
    const visitorDelegate = new VisitorDelegate(null, context, configManager)
    expect(visitorDelegate.visitorId).toBeDefined()
    expect(visitorDelegate.visitorId).toHaveLength(17)
  })

  it('test context', () => {
    const newContext = {
      IsVip: false,
      hasChild: true
    }
    visitorDelegate.context = newContext
    expect(updateContext).toBeCalledTimes(1)
    expect(updateContext).toBeCalledWith(newContext)
  })

  it('test modification', () => {
    expect(visitorDelegate.modifications.size).toBe(0)
    const newModification = new Map([['key', new Modification('newKey', 'cma', 'var', 'varId', true, 'value')]])
    visitorDelegate.modifications = newModification
    expect(visitorDelegate.modifications).toEqual(newModification)
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

  it('test property', () => {
    expect(visitorDelegate.hasConsented).toBeFalsy()

    visitorDelegate.setConsent(true)
    expect(visitorDelegate.hasConsented).toBeTruthy()

    expect(visitorDelegate.config).toBe(config)

    expect(visitorDelegate.configManager).toBe(configManager)

    visitorDelegate.modifications.set('newKey', new Modification('newKey', 'cma', 'var', 'varId', true, 'value'))
  })
})

describe('Name of the group', () => {
  const visitorDelegate = new VisitorDelegate('visitorId', {}, {} as ConfigManager)
  it('test updateContext', () => {
    const contexts = {
      isVip: false
    }
    visitorDelegate.updateContext(contexts)
    expect(updateContext).toBeCalledTimes(1)
    expect(updateContext).toBeCalledWith(contexts)
  })

  it('test clear', () => {
    visitorDelegate.clearContext()
    expect(clearContext).toBeCalledTimes(1)
  })

  it('test getModification', () => {
    getModification.mockResolvedValue([])
    const param = { key: 'key', defaultValue: 'value' }
    visitorDelegate.getModification(param)
      .then(() => {
        expect(getModification).toBeCalledTimes(2)
        expect(getModification).toBeCalledWith(param, undefined)
      })
      .catch((error) => {
        console.log(error)
      })

    visitorDelegate.getModification(param, true)
      .then(() => {
        expect(getModification).toBeCalledTimes(2)
        expect(getModification).toBeCalledWith(param, true)
      })
      .catch((error) => {
        console.log(error)
      })
  })

  it('test getModificationSync', () => {
    getModificationSync.mockReturnValue([])
    const param = { key: 'key', defaultValue: 'value' }
    visitorDelegate.getModificationSync(param)
    expect(getModificationSync).toBeCalledTimes(1)
    expect(getModificationSync).toBeCalledWith(param, undefined)
    visitorDelegate.getModificationSync(param, true)
    expect(getModificationSync).toBeCalledTimes(2)
    expect(getModificationSync).toBeCalledWith(param, true)
  })

  it('test getModificationInfo', () => {
    getModificationInfo.mockResolvedValue({} as Modification)
    visitorDelegate.getModificationInfo('key').then(() => {
      expect(getModificationInfo).toBeCalledTimes(1)
      expect(getModificationInfo).toBeCalledWith('key')
    })
  })

  it('test getModificationInfoSync', () => {
    getModificationInfoSync.mockReturnValue({} as Modification)
    visitorDelegate.getModificationInfoSync('key')
    expect(getModificationInfoSync).toBeCalledTimes(1)
    expect(getModificationInfoSync).toBeCalledWith('key')
  })

  it('test synchronizeModifications', () => {
    synchronizeModifications.mockResolvedValue()
    visitorDelegate.synchronizeModifications()
      .then(() => {
        expect(synchronizeModifications).toBeCalledTimes(1)
      })
  })

  it('test activateModification', () => {
    activateModification.mockResolvedValue()
    visitorDelegate.activateModification('key').then(() => {
      expect(activateModification).toBeCalledTimes(1)
      expect(activateModification).toBeCalledWith('key')
    })
  })

  it('test activateModification', () => {
    activateModificationSync.mockReturnValue()
    visitorDelegate.activateModificationSync('key')
    expect(activateModificationSync).toBeCalledTimes(1)
    expect(activateModificationSync).toBeCalledWith('key')
  })

  it('test sendHit', () => {
    sendHit.mockResolvedValue()
    const page = { type: HitType.PAGE, documentLocation: 'home' }
    visitorDelegate.sendHit(page).then(() => {
      expect(sendHit).toBeCalledTimes(1)
      expect(sendHit).toBeCalledWith(page)
    })
  })

  it('test sendHitSync', () => {
    sendHitSync.mockReturnValue()
    const page = { type: HitType.PAGE, documentLocation: 'home' }
    visitorDelegate.sendHitSync(page)
    expect(sendHitSync).toBeCalledTimes(1)
    expect(sendHitSync).toBeCalledWith(page)
  })

  it('test getAllModifications', () => {
    getAllModifications.mockResolvedValue({ visitorId: 'visitorId', campaigns: {} as CampaignDTO [] })
    visitorDelegate.getAllModifications().then(() => {
      expect(getAllModifications).toBeCalledTimes(1)
    })
  })

  it('test getModificationsForCampaign', () => {
    getModificationsForCampaign.mockResolvedValue({ visitorId: 'visitorId', campaigns: {} as CampaignDTO [] })
    const campaignId = 'campaignId'
    visitorDelegate.getModificationsForCampaign(campaignId).then(() => {
      expect(getModificationsForCampaign).toBeCalledTimes(1)
      expect(getModificationsForCampaign).toBeCalledWith(campaignId, false)
    })
  })
})
