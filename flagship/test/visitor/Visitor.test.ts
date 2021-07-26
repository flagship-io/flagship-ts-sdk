import { jest, expect, it, describe } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config/index'
import { ApiManager } from '../../src/decision/ApiManager'
import {
  CONTEXT_NULL_ERROR,
  CONTEXT_PARAM_ERROR,
  GET_MODIFICATION_CAST_ERROR,
  GET_MODIFICATION_ERROR,
  GET_MODIFICATION_KEY_ERROR,
  GET_MODIFICATION_MISSING_ERROR,
  HitType,
  PANIC_MODE_ERROR,
  PROCESS_ACTIVE_MODIFICATION,
  PROCESS_GET_ALL_MODIFICATION,
  PROCESS_GET_MODIFICATION,
  PROCESS_GET_MODIFICATION_INFO,
  PROCESS_MODIFICATIONS_FOR_CAMPAIGN,
  PROCESS_SEND_HIT,
  PROCESS_UPDATE_CONTEXT,
  SDK_APP,
  TRACKER_MANAGER_MISSING_ERROR,
  VISITOR_ID_ERROR
} from '../../src/enum/index'
import { EventCategory, Screen } from '../../src/hit/index'
import { Modification } from '../../src/model/Modification'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'
import { TYPE_HIT_REQUIRED_ERROR, Visitor } from '../../src/visitor/Visitor'
import { returnModification } from './modification'
import { HttpClient } from '../../src/utils/NodeHttpClient'
import { IHttpResponse, IHttpOptions } from '../../src/utils/httpClient'
import { Mock } from 'jest-mock'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNull = (): any => {
  return null
}

describe('test visitor', () => {
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

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const isPanic = jest.spyOn(apiManager, 'isPanic')

  const trackingManager = new TrackingManager(httpClient, config)

  const sendActive = jest.spyOn(trackingManager, 'sendActive')
  const sendHit = jest.spyOn(trackingManager, 'sendHit')

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitor = new Visitor(visitorId, context, configManager)

  it('should ', () => {
    expect(visitor.visitorId).toBe(visitorId)
    expect(visitor.config).toBe(config)
    expect(visitor.configManager).toBe(configManager)
    expect(visitor.context).toEqual({})
    expect(visitor.modifications).toBeDefined()
    expect(visitor.modifications.size).toBe(0)
  })

  it('test invalid visitor id', () => {
    visitor.visitorId = {} as string
    expect(visitor.visitorId).toBe(visitorId)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(VISITOR_ID_ERROR, 'VISITOR ID')

    visitor.visitorId = getNull()
    expect(visitor.visitorId).toBe(visitorId)
    expect(logError).toBeCalledTimes(2)
    expect(logError).toBeCalledWith(VISITOR_ID_ERROR, 'VISITOR ID')

    visitor.visitorId = ''
    expect(visitor.visitorId).toBe(visitorId)
    expect(logError).toBeCalledTimes(3)
    expect(logError).toBeCalledWith(VISITOR_ID_ERROR, 'VISITOR ID')
  })

  const expectContext = { age: 20, currency: 'EUR', isVip: true }

  it('test updateContextKeyValue', () => {
    visitor.updateContextKeyValue('age', 20)
    visitor.updateContextKeyValue('currency', 'EUR')
    visitor.updateContextKeyValue('isVip', true)

    expect(visitor.context).toEqual(expectContext)
  })

  it('test updateContextKeyValue invalid value', () => {
    const keyNewField = 'newField'
    visitor.updateContextKeyValue(keyNewField, {} as string)

    expect(visitor.context).toStrictEqual(expectContext)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(CONTEXT_PARAM_ERROR, keyNewField),
      PROCESS_UPDATE_CONTEXT
    )
  })

  it('test updateContextKeyValue invalid key', () => {
    visitor.updateContextKeyValue({} as string, 'value')
    expect(visitor.context).toStrictEqual(expectContext)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(CONTEXT_PARAM_ERROR, {}),
      PROCESS_UPDATE_CONTEXT
    )
  })

  const newContext = {
    local: 'fr',
    color: 'red'
  }

  it('test updateContext', () => {
    visitor.updateContext(newContext)
    expect(visitor.context).toStrictEqual({ ...expectContext, ...newContext })
  })

  it('test updateContext with null', () => {
    visitor.updateContext(getNull())
    expect(logError).toBeCalledTimes(1)
    expect(visitor.context).toStrictEqual({ ...expectContext, ...newContext })
    expect(logError).toBeCalledWith(CONTEXT_NULL_ERROR, PROCESS_UPDATE_CONTEXT)
  })

  it('test set context', () => {
    const setNewContext = {
      'car-color': 'blue'
    }
    visitor.context = setNewContext
    expect(visitor.context).toStrictEqual(setNewContext)
  })

  it('test clear Context', () => {
    visitor.clearContext()
    expect(visitor.context).toEqual({})
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
      visitor.on('ready', (err) => {
        expect(err).toBeUndefined()
      })
      getCampaignsAsync.mockResolvedValue(campaignDTO)
      getModifications.mockReturnValue(returnModification)
      await visitor.synchronizeModifications()
      expect(getCampaignsAsync).toBeCalledTimes(1)
      expect(getCampaignsAsync).toBeCalledWith(visitor)
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
      const modification = await visitor.getModification(
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
      const modifications = await visitor.getModification(params, activateAll)
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
    const modification = visitor.getModificationSync(
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
    const modification = visitor.getModificationSync(
      {
        key,
        defaultValue,
        activate
      }
    )
    expect<T>(modification).toEqual(defaultValue)
  }
  const testModificationWithDefaultArray = <T>(params: {key:string, defaultValue:T, activate?:boolean}[]) => {
    const modifications = visitor.getModificationSync(params)
    expect<T[]>(modifications).toEqual(params.map(item => item.defaultValue))
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

  it('test getModificationAsync key string with default activate', async () => {
    const returnMod = returnModification.get('keyString') as Modification
    const modification = await visitor.getModification(
      {
        key: returnMod.key,
        defaultValue: 'defaultValue'
      }
    )
    expect<string>(modification).toEqual(returnMod.value)
    expect(sendActive).toBeCalledTimes(0)
  })

  it('test getModification key string with default activate', () => {
    const returnMod = returnModification.get('keyString') as Modification
    const modification = visitor.getModificationSync(
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
      visitor,
      returnModification.get('keyString')
    )
  })

  const notExitKey = 'notExitKey'
  it('test getModification test key not exist', () => {
    const notExitKey = 'notExitKey'
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
      visitor,
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

  it('test getModification panic mode ', () => {
    isPanic.mockReturnValue(true)
    testModificationWithDefault('key', 'defaultValue')
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(PANIC_MODE_ERROR, PROCESS_GET_MODIFICATION),
      PROCESS_GET_MODIFICATION
    )
    isPanic.mockReturnValue(false)
  })
  it('test getModification with array panic mode  ', () => {
    isPanic.mockReturnValue(true)
    testModificationWithDefaultArray([{ key: 'key', defaultValue: 'defaultValue' }])
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(PANIC_MODE_ERROR, PROCESS_GET_MODIFICATION),
      PROCESS_GET_MODIFICATION
    )
    isPanic.mockReturnValue(false)
  })

  const returnMod = returnModification.get('keyString') as Modification
  it('test getModificationInfo', () => {
    const modification = visitor.getModificationInfoSync(returnMod.key)
    expect(logError).toBeCalledTimes(0)
    expect(modification).toBeDefined()
    expect(modification).toEqual(returnMod)
  })

  it('test key not exist in getModificationInfo', () => {
    const modification = visitor.getModificationInfoSync(notExitKey)
    expect(modification).toBeNull()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_ERROR, notExitKey),
      PROCESS_GET_MODIFICATION_INFO
    )
  })

  it('test key is not valid in getModificationInfo', () => {
    const modification = visitor.getModificationInfoSync(getNull())
    expect(modification).toBeNull()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_KEY_ERROR, null),
      PROCESS_GET_MODIFICATION_INFO
    )
  })

  it('test panic mode getModificationInfo ', () => {
    isPanic.mockReturnValue(true)
    const modification = visitor.getModificationInfoSync(returnMod.key)
    expect(modification).toBeNull()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(PANIC_MODE_ERROR, PROCESS_GET_MODIFICATION_INFO),
      PROCESS_GET_MODIFICATION_INFO
    )
    isPanic.mockReturnValue(false)
  })

  it('test getModificationInfoAsync ', async () => {
    try {
      const modification = await visitor.getModificationInfo(returnMod.key)
      expect(modification).toEqual(returnMod)
    } catch (error) {
      expect(logError).toBeCalled()
    }
  })

  it('test activateModification', () => {
    visitor.activateModificationSync(returnMod.key)
    expect(sendActive).toBeCalledTimes(1)
    expect(sendActive).toBeCalledWith(
      visitor,
      returnModification.get(returnMod.key)
    )
  })

  it('test activateModification with array key', async () => {
    const key1 = 'keyString'
    const key2 = 'keyNumber'
    await visitor.activateModification([{ key: key1 }, { key: key2 }])
    expect(sendActive).toBeCalledTimes(2)
    expect(sendActive).toBeCalledWith(
      visitor,
      returnModification.get(key1)
    )
    expect(sendActive).toBeCalledWith(
      visitor,
      returnModification.get(key2)
    )
  })

  it('test activateModification with array', async () => {
    const key1 = 'keyString'
    const key2 = 'keyNumber'
    await visitor.activateModification([key1, key2])
    expect(sendActive).toBeCalledTimes(2)
    expect(sendActive).toBeCalledWith(
      visitor,
      returnModification.get(key1)
    )
    expect(sendActive).toBeCalledWith(
      visitor,
      returnModification.get(key2)
    )
  })

  it('test invalid key in activateModification', () => {
    visitor.activateModificationSync(getNull())
    expect(sendActive).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_KEY_ERROR, getNull()),
      PROCESS_ACTIVE_MODIFICATION
    )
  })

  it('test key not exist in activateModification', () => {
    visitor.activateModificationSync(notExitKey)
    expect(sendActive).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_ERROR, notExitKey),
      PROCESS_ACTIVE_MODIFICATION
    )
  })

  it('test panic mode activateModification ', () => {
    isPanic.mockReturnValue(true)
    visitor.activateModificationSync(returnMod.key)
    expect(sendActive).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(PANIC_MODE_ERROR, PROCESS_ACTIVE_MODIFICATION),
      PROCESS_ACTIVE_MODIFICATION
    )
    isPanic.mockReturnValue(false)
  })

  it('test hasTrackingManager activateModification', () => {
    configManager.trackingManager = getNull()

    visitor.activateModificationSync(returnMod.key)

    expect(sendActive).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      TRACKER_MANAGER_MISSING_ERROR,
      PROCESS_ACTIVE_MODIFICATION
    )

    configManager.trackingManager = trackingManager
  })

  it('test activateModificationAsync', async () => {
    try {
      await visitor.activateModification(returnMod.key)
      expect(sendActive).toBeCalledTimes(1)
      expect(sendActive).toBeCalledWith(
        visitor,
        returnModification.get(returnMod.key)
      )
    } catch (error) {
      expect(logError).toBeCalled()
    }
  })

  it('test getAllModifications', async () => {
    const campaigns = await visitor.getAllModifications()
    expect(campaigns).toEqual({
      visitorId: visitor.visitorId,
      campaigns: campaignDTO
    })
  })

  it('test getAllModifications with activate', async () => {
    const campaigns = await visitor.getAllModifications(true)
    expect(campaigns).toEqual({
      visitorId: visitor.visitorId,
      campaigns: campaignDTO
    })
    expect(sendActive).toBeCalledTimes(8)
  })

  it('test getAllModifications on panic mode', async () => {
    isPanic.mockReturnValue(true)
    try {
      const campaigns = await visitor.getAllModifications(true)
      expect(campaigns).toBeNull()
      expect(campaigns).toBeNull()
      expect(sendActive).toBeCalledTimes(0)
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(
        sprintf(PANIC_MODE_ERROR, PROCESS_GET_ALL_MODIFICATION),
        PROCESS_GET_ALL_MODIFICATION
      )
    } catch (error) {
      console.log(error)
    }

    isPanic.mockReturnValue(false)
  })

  it('test getModificationsForCampaign', async () => {
    const campaigns = await visitor.getModificationsForCampaign(campaignDtoId)
    expect(campaigns).toEqual({
      visitorId: visitor.visitorId,
      campaigns: campaignDTO
    })
    expect(sendActive).toBeCalledTimes(0)
  })

  it('test getModificationsForCampaign with activate', async () => {
    const campaigns = await visitor.getModificationsForCampaign(campaignDtoId, true)
    expect(campaigns).toEqual({
      visitorId: visitor.visitorId,
      campaigns: campaignDTO
    })
    expect(sendActive).toBeCalledTimes(1)
  })

  it('test getModificationsForCampaign on panic mode', async () => {
    isPanic.mockReturnValue(true)
    try {
      const campaigns = await visitor.getModificationsForCampaign(campaignDtoId, true)
      expect(campaigns).toBeNull()
      expect(campaigns).toBeNull()
      expect(sendActive).toBeCalledTimes(0)
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(
        sprintf(PANIC_MODE_ERROR, PROCESS_MODIFICATIONS_FOR_CAMPAIGN),
        PROCESS_MODIFICATIONS_FOR_CAMPAIGN
      )
    } catch (error) {
      console.log(error)
    }

    isPanic.mockReturnValue(false)
  })

  const hitScreen = new Screen({ documentLocation: 'home' })

  it('test sendHit', () => {
    visitor.sendHitSync(hitScreen)
    expect(sendHit).toBeCalledTimes(1)
    expect(sendHit).toBeCalledWith(hitScreen)
  })

  it('test hasTrackingManager activateModification', () => {
    configManager.trackingManager = getNull()
    visitor.sendHitSync(hitScreen)

    expect(sendHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      TRACKER_MANAGER_MISSING_ERROR,
      PROCESS_SEND_HIT
    )

    configManager.trackingManager = trackingManager
  })

  it('panic mode sendHit', () => {
    isPanic.mockReturnValue(true)
    visitor.sendHitSync(hitScreen)

    expect(sendHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(PANIC_MODE_ERROR, PROCESS_SEND_HIT),
      PROCESS_SEND_HIT
    )
    isPanic.mockReturnValue(false)
  })

  it('test isReady sendHit', () => {
    const hitScreenNull = new Screen(getNull())
    visitor.sendHitSync(hitScreenNull)

    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      hitScreen.getErrorMessage(),
      PROCESS_SEND_HIT
    )
  })

  it('test sendHitAsync', async () => {
    try {
      await visitor.sendHit(hitScreen)
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
      await visitor.sendHit(hit)
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
      await visitor.sendHit(hit)
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
      await visitor.sendHit(hit)
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
      await visitor.sendHit(hit)
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
      await visitor.sendHit(hit)
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
      await visitor.sendHit(hit)
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
      await visitor.sendHit(hit)
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
      await visitor.sendHit(hits)
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
      await visitor.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(TYPE_HIT_REQUIRED_ERROR, PROCESS_SEND_HIT)
    expect(sendHit).toBeCalledTimes(0)
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

  const visitor = new Visitor(visitorId, context, configManager)
  const error = new Error('message')
  it('test synchronizeModifications error', async () => {
    visitor.on('ready', (err) => {
      expect(err).toBe(error)
    })
    getCampaignsAsync.mockRejectedValue(error)
    visitor.synchronizeModifications().catch(err => {
      expect(err).toBe(error)
      expect(logError).toBeCalled()
    })
  })
})
