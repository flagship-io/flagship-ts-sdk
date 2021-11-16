import { jest, expect, it, describe } from '@jest/globals'
import { CATEGORY_ERROR, ERROR_MESSAGE } from '../../src/hit/Event'
import { Event, EventCategory } from '../../src/hit/index'
import { DecisionApiConfig } from '../../src/config/index'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  CUSTOMER_UID,
  DS_API_ITEM,
  EVENT_ACTION_API_ITEM,
  EVENT_CATEGORY_API_ITEM,
  EVENT_LABEL_API_ITEM,
  EVENT_VALUE_API_ITEM,
  HitType,
  SDK_APP,
  TYPE_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../../src/enum/index'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNull = (): any => {
  return null
}

describe('test hit type Event', () => {
  const category = EventCategory.ACTION_TRACKING
  const action = 'action'
  const event = new Event({ category, action })

  it('should ', () => {
    expect(event.category).toBe(category)
    expect(event.action).toBe(action)
    expect(event.config).toBeUndefined()
    expect(event.ds).toBeUndefined()
    expect(event.label).toBeUndefined()
    expect(event.value).toBeUndefined()
    expect(event.visitorId).toBeUndefined()
    expect(event.anonymousId).toBeNull()
    expect(event.getErrorMessage()).toBe(ERROR_MESSAGE)
    expect(event.userIp).toBeUndefined()
    expect(event.screenResolution).toBeUndefined()
    expect(event.locale).toBeUndefined()
    expect(event.sessionNumber).toBeUndefined()
  })

  it('test constructor', () => {
    const params = {
      action: 'action',
      category: EventCategory.ACTION_TRACKING,
      label: 'label',
      value: 12,
      userIp: '127.0.0.1',
      screenResolution: '800X600',
      locale: 'fr',
      sessionNumber: '12345'
    }

    const event = new Event(params)
    expect(event.category).toBe(params.category)
    expect(event.action).toBe(params.action)
    expect(event.label).toBe(params.label)
    expect(event.value).toBe(params.value)
    expect(event.userIp).toBe(params.userIp)
    expect(event.screenResolution).toBe(params.screenResolution)
    expect(event.locale).toBe(params.locale)
    expect(event.sessionNumber).toBe(params.sessionNumber)
  })

  it('test isReady method ', () => {
    expect(event.isReady()).toBeFalsy()
  })

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')
  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  it('test set config ', () => {
    event.config = config
    expect(event.config).toBe(config)
  })

  it('test isReady method ', () => {
    expect(event.isReady()).toBeFalsy()
  })

  it('test set ds', () => {
    event.ds = SDK_APP
    expect(event.ds).toBe(SDK_APP)
  })

  it('test isReady method', () => {
    expect(event.isReady()).toBeFalsy()
  })

  const visitorId = 'visitorId'
  it('test visitorId', () => {
    event.visitorId = visitorId
    expect(event.visitorId).toBe(visitorId)
  })

  const anonymousId = 'anonymousId'
  it('test visitorId', () => {
    event.anonymousId = anonymousId
    expect(event.anonymousId).toBe(anonymousId)
  })

  it('test isReady method', () => {
    expect(event.isReady()).toBeTruthy()
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiKeys: Record<string, unknown> = {
    [VISITOR_ID_API_ITEM]: anonymousId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.EVENT,
    [EVENT_CATEGORY_API_ITEM]: category,
    [EVENT_ACTION_API_ITEM]: action,
    [CUSTOMER_UID]: visitorId
  }

  it('should ', () => {
    expect(event.toApiKeys()).toEqual(apiKeys)
  })

  it('test apiKey with anonymousId null', () => {
    event.anonymousId = null
    apiKeys[CUSTOMER_UID] = null
    apiKeys[VISITOR_ID_API_ITEM] = visitorId
    expect(event.toApiKeys()).toEqual(apiKeys)
  })

  const label = 'label'
  // test label
  it('test label ', () => {
    event.label = label
    expect(event.label).toBe(label)
    apiKeys[EVENT_LABEL_API_ITEM] = label

    expect(event.toApiKeys()).toEqual(apiKeys)

    event.label = getNull()

    expect(logError).toHaveBeenCalledWith(
      sprintf(TYPE_ERROR, 'label', 'string'),
      'label'
    )
    expect(event.label).toBe(label)
    expect(logError).toHaveBeenCalledTimes(1)
  })

  const value = 122
  // test set value
  it('test set value', () => {
    event.value = value
    expect(event.value).toBe(value)
    apiKeys[EVENT_VALUE_API_ITEM] = value

    expect(event.toApiKeys()).toEqual(apiKeys)

    event.value = {} as number
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'value', 'number'),
      'value'
    )
    expect(event.value).toBe(value)
    expect(logError).toHaveBeenCalledTimes(1)
  })

  it('test toObject', () => {
    const userIp = '127.0.0.1'
    const screenResolution = '800X600'
    const locale = 'fr'
    const sessionNumber = '12345'
    event.userIp = userIp
    event.screenResolution = screenResolution
    event.locale = locale
    event.sessionNumber = sessionNumber
    expect(event.toObject()).toEqual({ action, userIp, screenResolution, locale, sessionNumber, label, value, anonymousId: null, category, ds: SDK_APP, type: HitType.EVENT, visitorId })
  })

  it('test log category', () => {
    event.category = {} as EventCategory
    expect(event.category).toBe(category)
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toBeCalledWith(CATEGORY_ERROR, 'category')
  })

  it('test log action ', () => {
    event.action = ''
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'action', 'string'),
      'action'
    )
    expect(event.action).toBe(action)
  })
})
