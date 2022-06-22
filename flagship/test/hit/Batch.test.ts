import { expect, it, describe, beforeAll, afterAll, jest } from '@jest/globals'
import { CUSTOMER_ENV_ID_API_ITEM, SDK_APP, DS_API_ITEM } from '../../src/enum'
import { Page, Screen } from '../../src/hit'
import { Batch, ERROR_MESSAGE } from '../../src/hit/Batch'
import { Mock } from 'jest-mock'

describe('test hit Batch', () => {
  const methodNow = Date.now
  const mockNow:Mock<number, []> = jest.fn()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
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
        delete hitKeys[CUSTOMER_ENV_ID_API_ITEM]
        delete hitKeys[DS_API_ITEM]
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
