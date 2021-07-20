import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src/config/index'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  DL_API_ITEM,
  DS_API_ITEM,
  HitType,
  SDK_APP,
  TYPE_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../../src/enum/index'
import { Screen } from '../../src/hit/index'
import { ERROR_MESSAGE } from '../../src/hit/Screen'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'

describe('test hit type Page', () => {
  const screenName = 'home'
  const screen = new Screen({ screenName })

  it('should ', () => {
    expect(screen.screenName).toBe(screenName)

    expect(screen.getErrorMessage()).toBe(ERROR_MESSAGE)

    expect(screen.isReady()).toBeFalsy()
  })

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')
  const config = new DecisionApiConfig('envId', 'apiKey')
  config.logManager = logManager
  const visitorId = 'visitorId'

  it('should ', () => {
    screen.config = config
    screen.ds = SDK_APP
    screen.visitorId = visitorId
    expect(screen.isReady()).toBeTruthy()
  })

  it('test method apiKey ', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiKeys: any = {
      [VISITOR_ID_API_ITEM]: visitorId,
      [DS_API_ITEM]: SDK_APP,
      [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
      [T_API_ITEM]: HitType.SCREEN_VIEW,
      [DL_API_ITEM]: screenName
    }
    expect(screen.toApiKeys()).toEqual(apiKeys)
  })

  it('test log screenName url', () => {
    screen.screenName = ''
    expect(screen.screenName).toBe(screenName)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'screenName', 'string'),
      'screenName'
    )
  })
})
