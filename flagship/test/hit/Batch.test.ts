import { expect, it, describe } from '@jest/globals'
import { VISITOR_ID_API_ITEM, CUSTOMER_ENV_ID_API_ITEM, USER_IP_API_ITEM, SCREEN_RESOLUTION_API_ITEM, USER_LANGUAGE, SESSION_NUMBER, CUSTOMER_UID, SDK_APP } from '../../src/enum'
import { Page, Screen } from '../../src/hit'
import { Batch, ERROR_MESSAGE } from '../../src/hit/Batch'

describe('test hit Batch', () => {
  const hits = [
    new Screen({ documentLocation: 'screenName2' }),
    new Page({ documentLocation: 'http://localhost' })]
  const batch = new Batch({
    hits
  })

  it('test toApiKeys method ', () => {
    expect(batch.toApiKeys()).toEqual(expect.objectContaining({
      t: 'BATCH',
      h: hits.map(item => {
        const hitKeys = item.toApiKeys()
        delete hitKeys[VISITOR_ID_API_ITEM]
        delete hitKeys[CUSTOMER_ENV_ID_API_ITEM]
        delete hitKeys[USER_IP_API_ITEM]
        delete hitKeys[SCREEN_RESOLUTION_API_ITEM]
        delete hitKeys[USER_LANGUAGE]
        delete hitKeys[SESSION_NUMBER]
        delete hitKeys[VISITOR_ID_API_ITEM]
        delete hitKeys[CUSTOMER_UID]
        return hitKeys
      })
    }))
  })

  it('test isReady method', () => {
    expect(batch.isReady()).toBeFalsy()
    batch.visitorId = 'visitorID'
    batch.ds = SDK_APP
    batch.config = { envId: 'envId' }
    expect(batch.isReady()).toBeTruthy()
  })

  it('test getErrorMessage method', () => {
    expect(ERROR_MESSAGE).toBe(batch.getErrorMessage())
  })
})
