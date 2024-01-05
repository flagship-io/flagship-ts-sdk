import { IDecisionManager } from './../../src/decision/IDecisionManager'
import { EdgeConfig } from './../../src/config/EdgeConfig'
import { EdgeManager } from './../../src/decision/EdgeManager'
import { it, describe } from '@jest/globals'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { HttpClient } from '../../src/utils/HttpClient'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { TrackingManager } from '../../src/api/TrackingManager'

// const getCampaignsAsync: Mock<Promise<CampaignDTO[] | null>, [VisitorAbstract]> = jest.fn()

describe('Test EdgeManager', () => {
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()
  const config = new EdgeConfig()
  const edgeManager = new EdgeManager(httpClient, config, murmurHash)

  const visitor = new VisitorDelegate({
    hasConsented: true,
    visitorId: 'visitorId',
    context: {},
    configManager: {
      config,
      decisionManager: {} as IDecisionManager,
      trackingManager: new TrackingManager(httpClient, config)
    }
  })
  it('test getCampaign', async () => {
    // getCampaignsAsync.mockResolvedValue(null)
    await edgeManager.getCampaignsAsync(visitor)

    // expect(getCampaignsAsync).toBeCalledTimes(1)
    // expect(getCampaignsAsync).toBeCalledWith(visitor)
  })
})
