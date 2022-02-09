import { jest, expect, it, describe } from '@jest/globals'
import { HitCacheDTO, HitType } from '../../src'
import { HIT_CACHE_VERSION, SDK_APP } from '../../src/enum'
import { DefaultHitCache, FS_HIT_PREFIX } from '../../src/hit/DefaultHitCache'

describe('Test DefaultHitCache', () => {
  const defaultHitCache = new DefaultHitCache()
  const storageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.localStorage = storageMock as any
  const visitorId = 'visitorId'
  const visitorData : HitCacheDTO = {
    version: HIT_CACHE_VERSION,
    data: {
      visitorId: visitorId,
      anonymousId: null,
      type: HitType.SCREEN,
      content: {
        visitorId,
        ds: SDK_APP,
        type: HitType.SCREEN,
        anonymousId: null,
        documentLocation: 'home'
      },
      time: Date.now()
    }
  }

  it('should ', () => {
    defaultHitCache.cacheHit(visitorId, visitorData)
    expect(global.localStorage.setItem).toBeCalledTimes(1)
    expect(global.localStorage.setItem).toHaveBeenCalledWith(`${FS_HIT_PREFIX}${visitorId}`, JSON.stringify([visitorData]))
  })
  it('should ', () => {
    storageMock.getItem.mockReturnValue(JSON.stringify([visitorData]))
    defaultHitCache.cacheHit(visitorId, visitorData)
    expect(global.localStorage.setItem).toBeCalledTimes(1)
    expect(global.localStorage.setItem).toHaveBeenCalledWith(`${FS_HIT_PREFIX}${visitorId}`, JSON.stringify([visitorData, visitorData]))
  })
  it('should ', () => {
    defaultHitCache.flushHits(visitorId)
    expect(global.localStorage.removeItem).toBeCalledTimes(1)
    expect(global.localStorage.removeItem).toHaveBeenCalledWith(`${FS_HIT_PREFIX}${visitorId}`)
  })

  it('should ', () => {
    storageMock.getItem.mockReturnValue(JSON.stringify(visitorData))
    const data = defaultHitCache.lookupHits(visitorId)
    expect(data).toEqual(visitorData)
    expect(global.localStorage.removeItem).toBeCalledTimes(1)
  })
})
