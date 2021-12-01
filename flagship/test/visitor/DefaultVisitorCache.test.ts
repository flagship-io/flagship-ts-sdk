import { jest, expect, it, describe } from '@jest/globals'
import { VISITOR_CACHE_VERSION } from '../../src/enum'
import { VisitorSaveCacheDTO } from '../../src/types'
import { DefaultVisitorCache, VISITOR_PREFIX } from '../../src/visitor/DefaultVisitorCache'
import { campaigns } from '../decision/campaigns'

describe('Test DefaultVisitorCache', () => {
  const defaultVisitorCache = new DefaultVisitorCache()
  const storageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.localStorage = storageMock as any
  const visitorId = 'visitorId'
  const visitorData: VisitorSaveCacheDTO = {
    version: VISITOR_CACHE_VERSION,
    data: {
      visitorId: 'visitorID',
      anonymousId: null,
      consent: true,
      context: {},
      campaigns: campaigns.campaigns.map(campaign => {
        return {
          campaignId: campaign.id,
          variationGroupId: campaign.variationGroupId,
          variationId: campaign.variation.id,
          isReference: campaign.variation.reference,
          type: campaign.variation.modifications.type,
          activated: false,
          flags: campaign.variation.modifications.value
        }
      })
    }
  }

  it('should ', () => {
    defaultVisitorCache.cacheVisitor(visitorId, visitorData)
    expect(global.localStorage.setItem).toBeCalledTimes(1)
    expect(global.localStorage.setItem).toHaveBeenCalledWith(`${VISITOR_PREFIX}${visitorId}`, JSON.stringify(visitorData))
  })
  it('should ', () => {
    defaultVisitorCache.flushVisitor(visitorId)
    expect(global.localStorage.removeItem).toBeCalledTimes(1)
    expect(global.localStorage.removeItem).toHaveBeenCalledWith(`${VISITOR_PREFIX}${visitorId}`)
  })

  it('should ', () => {
    storageMock.getItem.mockReturnValue(JSON.stringify(visitorData))
    const data = defaultVisitorCache.lookupVisitor(visitorId)
    expect(data).toEqual(visitorData)
  })

  it('should ', () => {
    storageMock.getItem.mockReturnValue(null)
    const data = defaultVisitorCache.lookupVisitor(visitorId)
    expect(data).toBeNull()
  })
})
