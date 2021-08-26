import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig, EventCategory, Modification, Screen } from '../../src/index'
import { TrackingManager } from '../../src/api/TrackingManager'
import { BucketingConfig, ConfigManager } from '../../src/config/index'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { IHttpResponse, IHttpOptions } from '../../src/utils/httpClient'
import { HttpClient } from '../../src/utils/NodeHttpClient'
import { DefaultStrategy, TYPE_HIT_REQUIRED_ERROR } from '../../src/visitor/DefaultStrategy'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { Mock } from 'jest-mock'
import { CONTEXT_NULL_ERROR, CONTEXT_PARAM_ERROR, FLAGSHIP_VISITOR_NOT_AUTHENTICATE, GET_MODIFICATION_CAST_ERROR, GET_MODIFICATION_ERROR, GET_MODIFICATION_KEY_ERROR, GET_MODIFICATION_MISSING_ERROR, HitType, METHOD_DEACTIVATED_BUCKETING_ERROR, PROCESS_ACTIVE_MODIFICATION, PROCESS_GET_MODIFICATION, PROCESS_GET_MODIFICATION_INFO, PROCESS_SEND_HIT, PROCESS_SYNCHRONIZED_MODIFICATION, PROCESS_UPDATE_CONTEXT, SDK_APP, SDK_LANGUAGE, SDK_VERSION, TRACKER_MANAGER_MISSING_ERROR, VISITOR_ID_ERROR } from '../../src/enum'
import { sprintf } from '../../src/utils/utils'
import { returnModification } from './modification'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNull = (): any => {
  return null
}

describe('test DefaultStrategy ', () => {
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

  const post: Mock<
      Promise<IHttpResponse>,
      [url: string, options: IHttpOptions]
    > = jest.fn()
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

  const sendActive = jest.spyOn(trackingManager, 'sendActive')
  const sendHit = jest.spyOn(trackingManager, 'sendHit')

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })
  const defaultStrategy = new DefaultStrategy(visitorDelegate)

  const predefinedContext = {
    fs_client: SDK_LANGUAGE,
    fs_version: SDK_VERSION,
    fs_users: visitorDelegate.visitorId
  }

  const newContext = {
    local: 'fr',
    color: 'red'
  }

  it('test updateContext', () => {
    defaultStrategy.updateContext(newContext)
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext })
  })

  it('test updateContext null', () => {
    defaultStrategy.updateContext(getNull())
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(CONTEXT_NULL_ERROR, PROCESS_UPDATE_CONTEXT)
  })

  it('test updateContext invalid context', () => {
    defaultStrategy.updateContext({ key: {} as string })
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(CONTEXT_PARAM_ERROR, 'key'),
      PROCESS_UPDATE_CONTEXT
    )
  })

  it('test clear Context', () => {
    defaultStrategy.clearContext()
    expect(visitorDelegate.context).toEqual({})
  })

  const campaignDtoId = 'c2nrh1hjg50l9stringu8bg'
  const campaignDTO = [
    {
      id: campaignDtoId,
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

  it('test synchronizeModifications', async () => {
    try {
      visitorDelegate.on('ready', (err) => {
        expect(err).toBeUndefined()
      })
      getCampaignsAsync.mockResolvedValue(campaignDTO)
      getModifications.mockReturnValue(returnModification)
      await defaultStrategy.synchronizeModifications()
      expect(getCampaignsAsync).toBeCalledTimes(1)
      expect(getCampaignsAsync).toBeCalledWith(visitorDelegate)
      expect(getModifications).toBeCalledTimes(1)
      expect(getModifications).toBeCalledWith(campaignDTO)
    } catch (error) {
      console.log('test-jest', error)
      expect(logError).toBeCalled()
    }
  })

  const testModificationType = async <T>(
    key: string,
    defaultValue: T,
    activate = false
  ) => {
    try {
      const returnMod = returnModification.get(key) as Modification
      const modification = await defaultStrategy.getModification(
        {
          key: returnMod.key,
          defaultValue,
          activate
        }
      )
      expect<T>(modification).toEqual(returnMod.value)
    } catch (error) {
      expect(logError).toBeCalled()
    }
  }

  const testModificationTypeArray = async <T>(
    params: {key: string,
    defaultValue: T,
    activate? :boolean}[], activateAll = false
  ) => {
    try {
      const returnMod = params.map(item => returnModification.get(item.key) as Modification)
      const modifications = await defaultStrategy.getModification(params, activateAll)
      expect<T[]>(modifications).toEqual(returnMod.map(item => item.value))
    } catch (error) {
      expect(logError).toBeCalled()
    }
  }

  const testModificationErrorCast = <T>(
    key: string,
    defaultValue: T,
    activate = false
  ) => {
    const returnMod = returnModification.get(key) as Modification
    const modification = defaultStrategy.getModificationSync(
      {
        key: returnMod.key,
        defaultValue,
        activate
      }
    )
    expect<T>(modification).toEqual(defaultValue)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_CAST_ERROR, key),
      PROCESS_GET_MODIFICATION
    )
  }

  const testModificationWithDefault = <T>(
    key: string,
    defaultValue: T,
    activate = false
  ) => {
    const modification = defaultStrategy.getModificationSync(
      {
        key,
        defaultValue,
        activate
      }
    )
    expect<T>(modification).toEqual(defaultValue)
  }

  it('test getModification key string', () => {
    testModificationType('keyString', 'defaultString')
  })

  it('test getModification with array', () => {
    testModificationTypeArray<string|number>([
      { key: 'keyString', defaultValue: 'defaultString' },
      { key: 'keyNumber', defaultValue: 10 }
    ])
  })

  it('test getModification with array and activateAll', () => {
    testModificationTypeArray<string|number>([
      { key: 'keyString', defaultValue: 'defaultString' },
      { key: 'keyNumber', defaultValue: 10 },
      { key: 'keyNull', defaultValue: 10 }
    ], true)
    expect(sendActive).toBeCalledTimes(3)
  })

  it('test getModification key keyNumber', () => {
    testModificationType('keyNumber', 10)
  })

  it('test getModification key keyBoolean', () => {
    testModificationType('keyBoolean', false)
  })

  it('test getModification key array', () => {
    testModificationType('array', [])
  })

  it('test getModification key object ', () => {
    testModificationType('object', {})
    testModificationType('complex', {})
  })

  it('test getModification key string with default activate', async () => {
    const returnMod = returnModification.get('keyString') as Modification
    const modification = await defaultStrategy.getModification(
      {
        key: returnMod.key,
        defaultValue: 'defaultValue'
      }
    )
    expect<string>(modification).toEqual(returnMod.value)
    expect(sendActive).toBeCalledTimes(0)
  })

  it('test getModification key string with activate ', () => {
    testModificationType('keyString', 'defaultString', true)
    expect(sendActive).toBeCalledTimes(1)
    expect(sendActive).toBeCalledWith(
      visitorDelegate,
      returnModification.get('keyString')
    )
  })

  const notExitKey = 'notExitKey'
  it('test getModification test key not exist', () => {
    testModificationWithDefault(notExitKey, 'defaultValue')
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_MISSING_ERROR, notExitKey),
      PROCESS_GET_MODIFICATION
    )
  })

  it('test getModification test typeof value of key != defaultValue', () => {
    testModificationErrorCast('keyString', 10)
  })

  it('test getModification test typeof value of key != defaultValue 2', () => {
    testModificationErrorCast('array', 10)
  })

  it('test getModification test typeof value of key != defaultValue 3', () => {
    testModificationErrorCast('array', {})
  })

  it('test getModification test typeof value of key != defaultValue 4', () => {
    testModificationErrorCast('object', [])
  })

  it('test getModification test typeof value of key != defaultValue with activate and modification value = null', () => {
    testModificationErrorCast('keyNull', [], true)
    expect(sendActive).toBeCalledTimes(1)
    expect(sendActive).toBeCalledWith(
      visitorDelegate,
      returnModification.get('keyNull')
    )
  })

  it('test getModification test key == null or key != string ', () => {
    testModificationWithDefault({} as string, 'defaultValue')
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_KEY_ERROR, {}),
      PROCESS_GET_MODIFICATION
    )
  })

  const returnMod = returnModification.get('keyString') as Modification
  it('test getModificationInfo', async () => {
    const modification = await defaultStrategy.getModificationInfo(returnMod.key)
    expect(logError).toBeCalledTimes(0)
    expect(modification).toBeDefined()
    expect(modification).toEqual(returnMod)
  })

  it('test key not exist in getModificationInfo', () => {
    const modification = defaultStrategy.getModificationInfoSync(notExitKey)
    expect(modification).toBeNull()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_ERROR, notExitKey),
      PROCESS_GET_MODIFICATION_INFO
    )
  })

  it('test key is not valid in getModificationInfo', () => {
    const modification = defaultStrategy.getModificationInfoSync(getNull())
    expect(modification).toBeNull()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_KEY_ERROR, null),
      PROCESS_GET_MODIFICATION_INFO
    )
  })

  it('test activateModification', () => {
    defaultStrategy.activateModificationSync(returnMod.key)
    expect(sendActive).toBeCalledTimes(1)
    expect(sendActive).toBeCalledWith(
      visitorDelegate,
      returnModification.get(returnMod.key)
    )
  })

  it('test activateModification with array key', async () => {
    const key1 = 'keyString'
    const key2 = 'keyNumber'
    await defaultStrategy.activateModification([{ key: key1 }, { key: key2 }])
    expect(sendActive).toBeCalledTimes(2)
    expect(sendActive).toBeCalledWith(
      visitorDelegate,
      returnModification.get(key1)
    )
    expect(sendActive).toBeCalledWith(
      visitorDelegate,
      returnModification.get(key2)
    )
  })

  it('test activateModification with array', async () => {
    const key1 = 'keyString'
    const key2 = 'keyNumber'
    await defaultStrategy.activateModification([key1, key2])
    expect(sendActive).toBeCalledTimes(2)
    expect(sendActive).toBeCalledWith(
      visitorDelegate,
      returnModification.get(key1)
    )
    expect(sendActive).toBeCalledWith(
      visitorDelegate,
      returnModification.get(key2)
    )
  })

  it('test invalid key in activateModification', () => {
    defaultStrategy.activateModificationSync(getNull())
    expect(sendActive).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_KEY_ERROR, getNull()),
      PROCESS_ACTIVE_MODIFICATION
    )
  })

  it('test key not exist in activateModification', () => {
    defaultStrategy.activateModificationSync(notExitKey)
    expect(sendActive).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_ERROR, notExitKey),
      PROCESS_ACTIVE_MODIFICATION
    )
  })

  it('test hasTrackingManager activateModification', () => {
    configManager.trackingManager = getNull()

    defaultStrategy.activateModificationSync(returnMod.key)

    expect(sendActive).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      TRACKER_MANAGER_MISSING_ERROR,
      PROCESS_ACTIVE_MODIFICATION
    )

    configManager.trackingManager = trackingManager
  })

  it('test activateModification failed', async () => {
    try {
      const error = 'Error'
      sendActive.mockRejectedValue(error)
      await defaultStrategy.activateModification(returnMod.key)
      expect(sendActive).toBeCalledTimes(1)
      expect(sendActive).toBeCalledWith(
        visitorDelegate,
        returnModification.get(returnMod.key)
      )
    } catch (error) {
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(error, PROCESS_ACTIVE_MODIFICATION)
    }
  })

  it('test getAllModifications', async () => {
    const campaigns = await defaultStrategy.getAllModifications()
    expect(campaigns).toEqual({
      visitorId: visitorDelegate.visitorId,
      campaigns: campaignDTO
    })
  })

  it('test getAllModifications with activate', async () => {
    const campaigns = await defaultStrategy.getAllModifications(true)
    expect(campaigns).toEqual({
      visitorId: visitorDelegate.visitorId,
      campaigns: campaignDTO
    })
    expect(sendActive).toBeCalledTimes(8)
  })

  it('test getModificationsForCampaign', async () => {
    const campaigns = await defaultStrategy.getModificationsForCampaign(campaignDtoId)
    expect(campaigns).toEqual({
      visitorId: visitorDelegate.visitorId,
      campaigns: campaignDTO
    })
    expect(sendActive).toBeCalledTimes(0)
  })

  it('test getModificationsForCampaign with activate', async () => {
    const campaigns = await defaultStrategy.getModificationsForCampaign(campaignDtoId, true)
    expect(campaigns).toEqual({
      visitorId: visitorDelegate.visitorId,
      campaigns: campaignDTO
    })
    expect(sendActive).toBeCalledTimes(1)
  })

  const hitScreen = new Screen({ documentLocation: 'home' })

  it('test sendHit', () => {
    defaultStrategy.sendHitSync(hitScreen)
    expect(sendHit).toBeCalledTimes(1)
    expect(sendHit).toBeCalledWith(hitScreen)
  })

  it('test hasTrackingManager activateModification', () => {
    configManager.trackingManager = getNull()
    defaultStrategy.sendHitSync(hitScreen)

    expect(sendHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      TRACKER_MANAGER_MISSING_ERROR,
      PROCESS_SEND_HIT
    )

    configManager.trackingManager = trackingManager
  })

  it('test isReady sendHit', () => {
    const hitScreenNull = new Screen(getNull())
    defaultStrategy.sendHitSync(hitScreenNull)

    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      hitScreen.getErrorMessage(),
      PROCESS_SEND_HIT
    )
  })

  it('test sendHitAsync', async () => {
    try {
      await defaultStrategy.sendHit(hitScreen)
      expect(sendHit).toBeCalledTimes(1)
      expect(sendHit).toBeCalledWith(hitScreen)
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
      expect(sendHit).toBeCalledTimes(1)
      expect(sendHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    } catch (error) {
      console.log(error)
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
      expect(sendHit).toBeCalledTimes(1)
      expect(sendHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    } catch (error) {
      console.log(error)
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
    expect(sendHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    expect(sendHit).toBeCalledTimes(1)
  })

  it('test sendHitAsync with literal object PAGE ', async () => {
    const hit = {
      type: 'PAGE' as HitType,
      documentLocation: 'home'
    }

    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(sendHit).toBeCalledWith(expect.objectContaining({ ...hit, type: HitType.PAGE_VIEW, visitorId, ds: SDK_APP, config }))
    expect(sendHit).toBeCalledTimes(1)
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
    expect(sendHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    expect(sendHit).toBeCalledTimes(1)
  })

  it('test sendHitAsync with literal object PAGE ', async () => {
    const hit = {
      type: 'SCREEN' as HitType,
      documentLocation: 'home'
    }

    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(sendHit).toBeCalledWith(expect.objectContaining({ ...hit, type: HitType.SCREEN_VIEW, visitorId, ds: SDK_APP, config }))
    expect(sendHit).toBeCalledTimes(1)
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
    expect(sendHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    expect(sendHit).toBeCalledTimes(1)
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
      await defaultStrategy.sendHit(hits)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(sendHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ ...hits[0], visitorId, ds: SDK_APP, config }))
    expect(sendHit).toHaveBeenNthCalledWith(2, expect.objectContaining({ ...hits[1], visitorId, ds: SDK_APP, config }))
    expect(sendHit).toBeCalledTimes(2)
  })

  it('test sendHitAsync with literal object type NotEXIST ', async () => {
    const hit = {
      type: 'NOT_EXIST' as HitType,
      transactionId: 'transactionId',
      affiliation: 'affiliation'
    }
    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(TYPE_HIT_REQUIRED_ERROR, PROCESS_SEND_HIT)
    expect(sendHit).toBeCalledTimes(0)
  })

  it('test sendHit failed', async () => {
    try {
      const error = 'Error'
      sendHit.mockRejectedValue(error)
      await defaultStrategy.sendHit(hitScreen)
      expect(sendHit).toBeCalledTimes(1)
      expect(sendHit).toBeCalledWith(hitScreen)
    } catch (error) {
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(error, PROCESS_SEND_HIT)
    }
  })

  it('test unauthenticate with null anonymousId', () => {
    defaultStrategy.unauthenticate()
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBe(null)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(FLAGSHIP_VISITOR_NOT_AUTHENTICATE, 'unauthenticate')
  })

  it('test authenticate with null visitorId', () => {
    defaultStrategy.authenticate(getNull())
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBeNull()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(VISITOR_ID_ERROR, 'authenticate')
  })

  const authenticateId = 'authenticateId'
  it('test authenticate', () => {
    defaultStrategy.authenticate(authenticateId)
    expect(visitorDelegate.visitorId).toBe(authenticateId)
    expect(visitorDelegate.anonymousId).toBe(visitorId)
  })

  it('test unauthenticate', () => {
    defaultStrategy.unauthenticate()
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBeNull()
  })
})

describe('test authenticate on bucketing mode', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new BucketingConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const configManager = new ConfigManager(config, {} as ApiManager, {} as TrackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })
  const defaultStrategy = new DefaultStrategy(visitorDelegate)

  it('test authenticate on bucketing mode', () => {
    const authenticateId = 'authenticateId'
    defaultStrategy.authenticate(authenticateId)
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBe(null)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_BUCKETING_ERROR, 'authenticate'), 'authenticate')
  })

  it('test unauthenticate on bucketing mode', () => {
    defaultStrategy.unauthenticate()
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBe(null)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_BUCKETING_ERROR, 'unauthenticate'), 'unauthenticate')
  })
})

describe('synchronizeModifications', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {}

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

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

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })

  const defaultStrategy = new DefaultStrategy(visitorDelegate)

  const error = new Error('message')
  it('test synchronizeModifications error', async () => {
    visitorDelegate.on('ready', (err) => {
      expect(err).toBe(error)
    })
    getCampaignsAsync.mockRejectedValue(error)
    defaultStrategy.synchronizeModifications().catch(err => {
      expect(err).toBe(error)
      expect(logError).toBeCalled()
      expect(logError).toBeCalledWith(error.message, PROCESS_SYNCHRONIZED_MODIFICATION)
    })
  })
})
