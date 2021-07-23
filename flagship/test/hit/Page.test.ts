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
import { Page } from '../../src/hit/index'
import { ERROR_MESSAGE } from '../../src/hit/Page'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'

describe('test hit type Page', () => {
  const url = 'https://localhost'
  const page = new Page({ pageUrl: url })

  it('should', () => {
    expect(page.pageUrl).toBe(url)

    expect(page.getErrorMessage()).toBe(ERROR_MESSAGE)

    expect(page.isReady()).toBeFalsy()
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
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.PAGE_VIEW,
    [DL_API_ITEM]: url
  }

  it('test method apiKey', () => {
    expect(page.toApiKeys()).toEqual(apiKeys)
  })

  it('test log page url', () => {
    page.pageUrl = ''
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(TYPE_ERROR, 'pageUrl', 'string'),
      'pageUrl'
    )
    expect(page.pageUrl).toBe(url)
  })
})
