import { DecisionApiConfig } from '../../src/config/DecisionApiConfig'
import { IVisitorProfileCache } from '../../src/type.local'
import { VisitorProfileCache } from '../../src/visitor/VisitorProfileCache.node'

describe('VisitorProfileCacheNode.native', () => {
  const sdkConfig = new DecisionApiConfig()

  let cache: IVisitorProfileCache

  beforeEach(() => {
    cache = new VisitorProfileCache(sdkConfig)
  })

  describe('saveVisitorProfile', () => {
    it('should call getOnSaveVisitorProfile and save the visitor profile', () => {
      cache.saveVisitorProfile({ visitorId: 'testId', anonymousId: 'testAnonymousId' })
    })
  })

  describe('loadVisitorProfile', () => {
    it('should load and parse the visitor profile', () => {
      const result = cache.loadVisitorProfile()
      expect(result).toEqual(null)
    })
  })
})
