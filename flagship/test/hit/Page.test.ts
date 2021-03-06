import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src/config/index'
import {
  CUSTOMER_ENV_ID_API_ITEM,
  CUSTOMER_UID,
  DL_API_ITEM,
  DS_API_ITEM,
  HitType,
  SCREEN_RESOLUTION_API_ITEM,
  SDK_APP,
  SESSION_NUMBER,
  TYPE_ERROR,
  T_API_ITEM,
  USER_IP_API_ITEM,
  USER_LANGUAGE,
  VISITOR_ID_API_ITEM
} from '../../src/enum/index'
import { Page } from '../../src/hit/index'
import { ERROR_MESSAGE } from '../../src/hit/Page'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNull = (): any => {
  return null
}
describe('test hit type Page', () => {
  const url = 'https://localhost'
  const page = new Page({ documentLocation: url })

  it('should', () => {
    expect(page.documentLocation).toBe(url)
    expect(page.getErrorMessage()).toBe(ERROR_MESSAGE)
    expect(page.isReady()).toBeFalsy()
  })

  it('should ', () => {
    const page = new Page(getNull())
    expect(page.documentLocation).toBeUndefined()
  })

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager
  const visitorId = 'visitorId'

  it('should ', () => {
    page.config = config
    page.ds = SDK_APP
    page.visitorId = visitorId
    expect(page.isReady()).toBeTruthy()
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiKeys: any = {
    [VISITOR_ID_API_ITEM]: visitorId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_UID]: null,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.PAGE_VIEW,
    [DL_API_ITEM]: url
  }

  it('test method apiKey', () => {
    expect(page.toApiKeys()).toEqual(apiKeys)
  })

  it('test toObject method', () => {
    const userIp = '127.0.0.1'
    const screenResolution = '800X600'
    const locale = 'fr'
    const sessionNumber = '12345'
    page.userIp = userIp
    page.screenResolution = screenResolution
    page.locale = locale
    page.sessionNumber = sessionNumber
    expect(page.toObject()).toEqual({
      userIp,
      screenResolution,
      locale,
      sessionNumber,
      anonymousId: null,
      visitorId,
      ds: SDK_APP,
      type: HitType.PAGE,
      documentLocation: url
    })

    expect(page.toApiKeys()).toEqual({ ...apiKeys, [USER_IP_API_ITEM]: userIp, [SCREEN_RESOLUTION_API_ITEM]: screenResolution, [USER_LANGUAGE]: locale, [SESSION_NUMBER]: sessionNumber })
  })

  it('test log page url', () => {
    page.documentLocation = ''
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'documentLocation', 'string'),
      'documentLocation'
    )
    expect(page.documentLocation).toBe(url)
  })
})
