import { jest, expect, it, describe } from '@jest/globals'
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
  const visitorData = 'visitorData'

  it('should ', () => {
    defaultHitCache.cacheHit(visitorId, visitorData)
    expect(global.localStorage.setItem).toBeCalledTimes(1)
    expect(global.localStorage.setItem).toHaveBeenCalledWith(`${FS_HIT_PREFIX}${visitorId}`, `[${visitorData}]`)
  })
  it('should ', () => {
    storageMock.getItem.mockReturnValue(`[${visitorData}]`)
    defaultHitCache.cacheHit(visitorId, visitorData)
    expect(global.localStorage.setItem).toBeCalledTimes(1)
    expect(global.localStorage.setItem).toHaveBeenCalledWith(`${FS_HIT_PREFIX}${visitorId}`, `[${visitorData},${visitorData}]`)
  })
  it('should ', () => {
    defaultHitCache.flushHits(visitorId)
    expect(global.localStorage.removeItem).toBeCalledTimes(1)
    expect(global.localStorage.removeItem).toHaveBeenCalledWith(`${FS_HIT_PREFIX}${visitorId}`)
  })

  it('should ', () => {
    storageMock.getItem.mockReturnValue(visitorData)
    const data = defaultHitCache.lookupHits(visitorId)
    expect(data).toBe(visitorData)
    expect(global.localStorage.removeItem).toBeCalledTimes(1)
  })
})
