import { jest, expect, it, describe } from '@jest/globals'
import { DefaultVisitorCache, VISITOR_PREFIX } from '../../src/visitor/DefaultVisitorCache'

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
  const visitorData = 'visitorData'

  it('should ', () => {
    defaultVisitorCache.cacheVisitor(visitorId, visitorData)
    expect(global.localStorage.setItem).toBeCalledTimes(1)
    expect(global.localStorage.setItem).toHaveBeenCalledWith(`${VISITOR_PREFIX}${visitorId}`, visitorData)
  })
  it('should ', () => {
    defaultVisitorCache.flushVisitor(visitorId)
    expect(global.localStorage.removeItem).toBeCalledTimes(1)
    expect(global.localStorage.removeItem).toHaveBeenCalledWith(`${VISITOR_PREFIX}${visitorId}`)
  })

  it('should ', () => {
    storageMock.getItem.mockReturnValue(visitorData)
    const data = defaultVisitorCache.lookupVisitor(visitorId)
    expect(data).toBe(visitorData)
  })
})
