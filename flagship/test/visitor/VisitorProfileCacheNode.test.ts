import { DecisionApiConfig } from '../../src/config/DecisionApiConfig'
import { IVisitorProfileCache } from '../../src/type.local'
import { VisitorProfileCacheNode } from '../../src/visitor/VisitorProfileCacheNode'

describe('VisitorProfileCacheNode.native', () => {
  const sdkConfig = new DecisionApiConfig()

  let cache: IVisitorProfileCache

  beforeEach(() => {
    cache = new VisitorProfileCacheNode(sdkConfig)
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
