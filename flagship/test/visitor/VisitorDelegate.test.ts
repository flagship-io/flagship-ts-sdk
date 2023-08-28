import { primitive } from './../../src/types'
import { jest, expect, it, describe } from '@jest/globals'
import { FlagDTO } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagSynchStatus, HitType, VISITOR_ID_ERROR } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { IFlagMetadata, IHit, modificationsRequested } from '../../src/types'
import { CampaignDTO } from '../../src/decision/api/models'
import { DecisionManager } from '../../src/decision/DecisionManager'
import { cacheVisitor } from '../../src/visitor/VisitorCache'

const updateContext = jest.fn()
const clearContext = jest.fn()
const getModification = jest.fn<(params: modificationsRequested<unknown>, activateAll?: boolean)=>Promise<unknown>>()
const getModificationSync = jest.fn()
const getModifications = jest.fn<(params: modificationsRequested<unknown>[], activateAll?: boolean) =>Promise<Record<string, unknown>>>()
const getModificationsSync = jest.fn()
const getModificationInfo = jest.fn<(key: string)=>Promise<FlagDTO>>()
const getModificationInfoSync = jest.fn()
const synchronizeModifications = jest.fn<()=>Promise<void>>()
const fetchFlags = jest.fn<()=>Promise<void>>()
const activateModification = jest.fn<(keys: string)=>Promise<void>>()
const activateModifications = jest.fn<(keys: string[])=>Promise<void>>()
const activateModificationSync = jest.fn<(keys: string)=>void>()
const activateModificationsSync = jest.fn<(keys: string[])=>void>()

const getFlagMetadata = jest.fn<(metadata:IFlagMetadata)=>IFlagMetadata>()
const sendHit = jest.fn<(hit: IHit)=> Promise<void>>()

const sendHits = jest.fn<(hit: IHit[])=>Promise<void>>()
const sendHitsSync = jest.fn<(hit: IHit[])=>void>()

const getAllModifications = jest.fn<(activate: boolean)=>Promise<{
  visitorId: string;
  campaigns: CampaignDTO[];
}>>()

const getAllFlagsData = jest.fn<(activate: boolean)=>Promise<{
  visitorId: string;
  campaigns: CampaignDTO[];
}>>()

const getModificationsForCampaign = jest.fn<(campaignId: string, activate?: boolean)=>Promise<{
  visitorId: string;
  campaigns: CampaignDTO[];
}>>()

const getFlatsDataForCampaign = jest.fn<(campaignId: string, activate?: boolean)=>Promise<{
  visitorId: string;
  campaigns: CampaignDTO[];
}>>()

const authenticate = jest.fn<(visitorId:string)=>void>()
const unauthenticate = jest.fn<()=>void>()
const setConsent = jest.fn<(hasConsented: boolean)=>void>()

const updateCampaigns = jest.fn<(campaigns: CampaignDTO[])=>void>()
const lookupVisitor = jest.fn<()=>void>()
const lookupHits = jest.fn()
const cacheVisitorFn = jest.fn<()=>Promise<void>>()
const visitorExposed = jest.fn<(param:{key:string, flag?:FlagDTO, defaultValue:unknown})=>Promise<void>>()
const getFlagValue = jest.fn<(param:{ key:string, defaultValue: unknown, flag?:FlagDTO, userExposed?: boolean})=>unknown>()

jest.mock('../../src/visitor/DefaultStrategy', () => {
  return {
    DefaultStrategy: jest.fn().mockImplementation(() => {
      return {
        setConsent,
        updateContext,
        clearContext,
        getModification,
        getModificationSync,
        getModifications,
        getModificationsSync,
        getModificationInfo,
        getModificationInfoSync,
        synchronizeModifications,
        activateModification,
        activateModificationSync,
        activateModifications,
        activateModificationsSync,
        sendHit,
        sendHits,
        sendHitsSync,
        getAllModifications,
        getAllFlagsData,
        getModificationsForCampaign,
        getFlatsDataForCampaign,
        authenticate,
        unauthenticate,
        updateCampaigns,
        lookupVisitor,
        lookupHits,
        fetchFlags,
        getFlagMetadata,
        cacheVisitor: cacheVisitorFn,
        visitorExposed,
        getFlagValue
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

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager: configManager as ConfigManager, initialCampaigns: campaigns })

  expect(updateContext).toBeCalledTimes(1)
  expect(updateContext).toBeCalledWith(context, undefined)
  expect(updateCampaigns).toBeCalledTimes(1)
  expect(updateCampaigns).toBeCalledWith(campaigns)

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
    const visitorDelegate = new VisitorDelegate({ context, configManager })
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

  it('test flagsData', () => {
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
    expect(visitorDelegate.getFlagsDataArray()).toEqual([flag])
    visitorDelegate.flagsData.clear()
  })

  it('test modification', () => {
    expect(visitorDelegate.flagsData.size).toBe(0)
    const modification = {
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
    const newModification = new Map([['key', modification]])
    visitorDelegate.modifications = newModification
    expect(visitorDelegate.modifications).toEqual(newModification)
    expect(visitorDelegate.getModificationsArray()).toEqual([modification])
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
    const visitorDelegate = new VisitorDelegate({ visitorId, isAuthenticated: true, context, configManager: configManager as ConfigManager })
    expect(visitorDelegate.anonymousId).toBeDefined()
    expect(visitorDelegate.anonymousId).toHaveLength(36)
  })
})

describe('test VisitorDelegate methods', () => {
  const logManager = new FlagshipLogManager()
  const logWarning = jest.spyOn(logManager, 'warning')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const visitorDelegate = new VisitorDelegate({ visitorId: 'visitorId', context: {}, configManager: { config, decisionManager: {} as DecisionManager, trackingManager: {} as TrackingManager } })

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

    visitorDelegate.flagSynchStatus = FlagSynchStatus.FLAGS_FETCHED

    visitorDelegate.flagsData.set('newKey', flagDTO)
    let flag = visitorDelegate.getFlag('newKey', 'defaultValue')

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

    visitorDelegate.flagSynchStatus = FlagSynchStatus.AUTHENTICATED
    flag = visitorDelegate.getFlag('newKey', 'defaultValue')
    expect(logWarning).toBeCalledTimes(1)
  })

  it('test getModification', () => {
    getModification.mockResolvedValue([])
    const param = { key: 'key', defaultValue: 'value' }
    visitorDelegate.getModification(param)
      .then(() => {
        expect(getModification).toBeCalledTimes(2)
        expect(getModification).toBeCalledWith(param)
      })
      .catch((error) => {
        console.log(error)
      })

    visitorDelegate.getModification(param)
      .then(() => {
        expect(getModification).toBeCalledTimes(2)
        expect(getModification).toBeCalledWith(param)
      })
      .catch((error) => {
        console.log(error)
      })
  })

  it('test getModifications', () => {
    getModifications.mockResolvedValue({})
    const param = [{ key: 'key', defaultValue: 'value' }]
    visitorDelegate.getModifications(param)
      .then(() => {
        expect(getModifications).toBeCalledTimes(2)
        expect(getModifications).toBeCalledWith(param, undefined)
      })
      .catch((error) => {
        console.log(error)
      })

    visitorDelegate.getModifications(param, true)
      .then(() => {
        expect(getModifications).toBeCalledTimes(2)
        expect(getModifications).toBeCalledWith(param, true)
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
    expect(getModificationSync).toBeCalledWith(param)
    visitorDelegate.getModificationSync(param)
    expect(getModificationSync).toBeCalledTimes(2)
    expect(getModificationSync).toBeCalledWith(param)
  })

  it('test getModificationsSync', () => {
    getModificationSync.mockReturnValue([])
    const param = [{ key: 'key', defaultValue: 'value' }]
    visitorDelegate.getModificationsSync(param)
    expect(getModificationsSync).toBeCalledTimes(1)
    expect(getModificationsSync).toBeCalledWith(param, undefined)
    visitorDelegate.getModificationsSync(param, true)
    expect(getModificationsSync).toBeCalledTimes(2)
    expect(getModificationsSync).toBeCalledWith(param, true)
  })

  it('test getModificationInfo', () => {
    getModificationInfo.mockResolvedValue({} as FlagDTO)
    visitorDelegate.getModificationInfo('key').then(() => {
      expect(getModificationInfo).toBeCalledTimes(1)
      expect(getModificationInfo).toBeCalledWith('key')
    })
  })

  it('test getModificationInfoSync', () => {
    getModificationInfoSync.mockReturnValue({} as FlagDTO)
    visitorDelegate.getModificationInfoSync('key')
    expect(getModificationInfoSync).toBeCalledTimes(1)
    expect(getModificationInfoSync).toBeCalledWith('key')
  })

  it('test synchronizeModifications', () => {
    synchronizeModifications.mockResolvedValue()
    cacheVisitorFn.mockResolvedValue()
    visitorDelegate.synchronizeModifications()
      .then(() => {
        expect(synchronizeModifications).toBeCalledTimes(1)
      }).catch(err => console.log(err))
  })

  it('test fetchFlags', () => {
    fetchFlags.mockResolvedValue()
    cacheVisitorFn.mockResolvedValue()
    visitorDelegate.fetchFlags()
      .then(() => {
        expect(fetchFlags).toBeCalledTimes(1)
      }).catch(err => console.log(err))
  })

  it('test userExposed', () => {
    visitorExposed.mockResolvedValue()
    const params = { key: 'key', flag: undefined, defaultValue: 'defaultValue' }
    visitorDelegate.visitorExposed(params)
      .then(() => {
        expect(visitorExposed).toBeCalledTimes(1)
        expect(visitorExposed).toBeCalledWith(params)
      }).catch(err => console.log(err))
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

  it('test activateModification', () => {
    activateModification.mockResolvedValue()
    visitorDelegate.activateModification('key').then(() => {
      expect(activateModification).toBeCalledTimes(1)
      expect(activateModification).toBeCalledWith('key')
    })
  })

  it('test activateModifications', () => {
    activateModifications.mockResolvedValue()
    visitorDelegate.activateModifications(['key']).then(() => {
      expect(activateModifications).toBeCalledTimes(1)
      expect(activateModifications).toBeCalledWith(['key'])
    })
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

  it('test getAllModifications', async () => {
    getAllModifications.mockResolvedValue({ visitorId: 'visitorId', campaigns: {} as CampaignDTO [] })
    await visitorDelegate.getAllModifications()
    expect(getAllModifications).toBeCalledTimes(1)
    await visitorDelegate.getAllModifications(false)
    expect(getAllModifications).toBeCalledTimes(2)
  })

  it('test getAllFlags', async () => {
    getAllFlagsData.mockResolvedValue({ visitorId: 'visitorId', campaigns: {} as CampaignDTO [] })
    await visitorDelegate.getAllFlagsData()
    expect(getAllFlagsData).toBeCalledTimes(1)
    await visitorDelegate.getAllFlagsData(false)
    expect(getAllFlagsData).toBeCalledTimes(2)
  })

  it('test getModificationsForCampaign', async () => {
    getModificationsForCampaign.mockResolvedValue({ visitorId: 'visitorId', campaigns: {} as CampaignDTO [] })
    const campaignId = 'campaignId'
    await visitorDelegate.getModificationsForCampaign(campaignId)
    expect(getModificationsForCampaign).toBeCalledTimes(1)
    expect(getModificationsForCampaign).toBeCalledWith(campaignId, false)

    await visitorDelegate.getModificationsForCampaign(campaignId, true)
    expect(getModificationsForCampaign).toBeCalledTimes(2)
    expect(getModificationsForCampaign).toBeCalledWith(campaignId, true)
  })

  it('test getFlatsForCampaign', async () => {
    getFlatsDataForCampaign.mockResolvedValue({ visitorId: 'visitorId', campaigns: {} as CampaignDTO [] })
    const campaignId = 'campaignId'
    await visitorDelegate.getFlatsDataForCampaign(campaignId)
    expect(getFlatsDataForCampaign).toBeCalledTimes(1)
    expect(getFlatsDataForCampaign).toBeCalledWith(campaignId, false)

    await visitorDelegate.getFlatsDataForCampaign(campaignId, true)
    expect(getFlatsDataForCampaign).toBeCalledTimes(2)
    expect(getFlatsDataForCampaign).toBeCalledWith(campaignId, true)
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
})

describe('Name of the group', () => {
  const config = new DecisionApiConfig()
  config.enableClientCache = true

  const visitorId = 'visitorId'
  const anonymousId = 'anonymousId'

  it('should ', () => {
    const loadVisitorProfile = jest.fn<typeof cacheVisitor.loadVisitorProfile>()
    cacheVisitor.loadVisitorProfile = loadVisitorProfile
    loadVisitorProfile.mockReturnValue({ visitorId, anonymousId })
    const visitorDelegate = new VisitorDelegate({
      context: {},
      configManager: {
        config,
        decisionManager: {} as DecisionManager,
        trackingManager: {} as TrackingManager
      }
    })
    expect(visitorDelegate.visitorId).toBe(anonymousId)
    expect(visitorDelegate.anonymousId).toBeNull()
  })

  it('should ', () => {
    const loadVisitorProfile = jest.fn<typeof cacheVisitor.loadVisitorProfile>()
    cacheVisitor.loadVisitorProfile = loadVisitorProfile
    loadVisitorProfile.mockReturnValue({ visitorId, anonymousId })
    const visitorDelegate = new VisitorDelegate({
      context: {},
      isAuthenticated: true,
      configManager: {
        config,
        decisionManager: {} as DecisionManager,
        trackingManager: {} as TrackingManager
      }
    })
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBe(anonymousId)
  })
  it('should ', () => {
    const loadVisitorProfile = jest.fn<typeof cacheVisitor.loadVisitorProfile>()
    cacheVisitor.loadVisitorProfile = loadVisitorProfile
    loadVisitorProfile.mockReturnValue({ visitorId, anonymousId: null })
    const visitorDelegate = new VisitorDelegate({
      context: {},
      isAuthenticated: true,
      configManager: {
        config,
        decisionManager: {} as DecisionManager,
        trackingManager: {} as TrackingManager
      }
    })
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBeDefined()
  })

  it('should ', () => {
    const loadVisitorProfile = jest.fn<typeof cacheVisitor.loadVisitorProfile>()
    cacheVisitor.loadVisitorProfile = loadVisitorProfile
    loadVisitorProfile.mockReturnValue({ visitorId, anonymousId: null })
    const visitorDelegate = new VisitorDelegate({
      context: {},
      configManager: {
        config,
        decisionManager: {} as DecisionManager,
        trackingManager: {} as TrackingManager
      }
    })
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBeNull()
  })
})

describe('test initialModifications', () => {
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

  it('should initialModifications with Map', () => {
    const newModification = new Map([['newKey', {
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      value: 'value',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    }]])
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      configManager: configManager as ConfigManager,
      initialCampaigns: campaigns,
      initialModifications: newModification
    })

    expect(visitorDelegate.flagsData).toEqual(newModification)
  })

  it('should initialModifications with Array', () => {
    const modification = {
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
    const newModification = new Map([['newKey', modification]])
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      configManager: configManager as ConfigManager,
      initialCampaigns: campaigns,
      initialModifications: [modification]
    })

    expect(visitorDelegate.flagsData).toEqual(newModification)
  })

  it('should initialModifications with plain objet', () => {
    const modification = {
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
    const newModification = new Map([['newKey', modification]])
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      configManager: configManager as ConfigManager,
      initialCampaigns: campaigns,
      initialModifications: [modification]
    })

    expect(visitorDelegate.flagsData).toEqual(newModification)
  })

  it('should initialModifications with Array', () => {
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      context,
      configManager: configManager as ConfigManager,
      initialCampaigns: campaigns,
      initialModifications: {} as []
    })

    expect(visitorDelegate.flagsData.size).toBe(0)
  })
})
