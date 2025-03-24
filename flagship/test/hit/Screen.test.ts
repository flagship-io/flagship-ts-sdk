import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src/config/index'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  CUSTOMER_UID,
  DL_API_ITEM,
  DS_API_ITEM,
  HitType,
  QT_API_ITEM,
  SDK_APP,
  TYPE_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../../src/enum/index'
import { Screen, ERROR_MESSAGE } from '../../src/hit/Screen'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'

describe('test hit type Page', () => {
  const documentLocation = 'home'
  const visitorId = 'visitorId'
  const screen = new Screen({ documentLocation, visitorId })

  it('should ', () => {
    expect(screen.documentLocation).toBe(documentLocation)

    expect(screen.getErrorMessage()).toBe(ERROR_MESSAGE)

    expect(screen.isReady()).toBeFalsy()
  })

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')
  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  it('should ', () => {
    screen.config = config
    screen.ds = SDK_APP
    screen.visitorId = visitorId
    expect(screen.isReady()).toBeTruthy()
    expect(screen.isReady(false)).toBeTruthy()
  })

  it('test method apiKey ', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiKeys: any = {
      [VISITOR_ID_API_ITEM]: visitorId,
      [DS_API_ITEM]: SDK_APP,
      [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
      [T_API_ITEM]: HitType.SCREEN_VIEW,
      [DL_API_ITEM]: documentLocation,
      [CUSTOMER_UID]: null,
      [QT_API_ITEM]: expect.anything()
    }
    expect(screen.toApiKeys()).toEqual(apiKeys)
  })

  it('test toObject method', () => {
    const userIp = '127.0.0.1'
    const screenResolution = '800X600'
    const locale = 'fr'
    const sessionNumber = '12345'
    const key = 'key'
    screen.userIp = userIp
    screen.screenResolution = screenResolution
    screen.locale = locale
    screen.sessionNumber = sessionNumber
    screen.key = key
    expect(screen.toObject()).toEqual({
      userIp,
      screenResolution,
      locale,
      sessionNumber,
      anonymousId: null,
      visitorId,
      key,
      createdAt: expect.anything(),
      ds: SDK_APP,
      type: HitType.SCREEN,
      documentLocation
    })
  })

  it('test log documentLocation url', () => {
    screen.documentLocation = ''
    expect(screen.documentLocation).toBe(documentLocation)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'documentLocation', 'string'),
      'documentLocation'
    )
  })
})
