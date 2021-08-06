import { jest, expect, it, describe } from '@jest/globals'
import { BucketingConfig } from '../../src/config/BucketingConfig'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { BucketingManager } from '../../src/decision/BucketingManager'
import { HttpClient } from '../../src/utils/NodeHttpClient'
import { bucketing } from './bucketing'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { ConfigManager } from '../../src/config'

describe('test BucketingManager', () => {
  const config = new BucketingConfig({ pollingInterval: 0 })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()

  const getAsync = jest.spyOn(httpClient, 'getAsync')

  const bucketingManager = new BucketingManager(httpClient, config, murmurHash)

  const visitorId = 'visitor_1'
  const context = {
    age: 20
  }

  const visitor = new VisitorDelegate({ visitorId, context, configManager: {} as ConfigManager })

  it('test getCampaignsAsync empty', async () => {
    const campaigns = await bucketingManager.getCampaignsAsync(visitor)
    expect(campaigns).toHaveLength(0)
  })

  it('test getCampaignsAsync panic mode', async () => {
    getAsync.mockResolvedValue({ body: { panic: true }, status: 200 })
    await bucketingManager.startPolling()
    const campaigns = await bucketingManager.getCampaignsAsync(visitor)
    expect(campaigns).toHaveLength(0)
    expect(bucketingManager.isPanic()).toBeTruthy()
  })

  it('test getCampaignsAsync campaign empty', async () => {
    getAsync.mockResolvedValue({ body: {}, status: 200 })
    await bucketingManager.startPolling()
    const campaigns = await bucketingManager.getCampaignsAsync(visitor)
    expect(campaigns).toHaveLength(0)
    expect(bucketingManager.isPanic()).toBeFalsy()
  })

  it('test getCampaignsAsync campaign', async () => {
    getAsync.mockResolvedValue({ body: bucketing, status: 200 })
    await bucketingManager.startPolling()
    const modifications = await bucketingManager.getCampaignsModificationsAsync(visitor)
    console.log(modifications)
    expect(modifications.size).toBe(6)
  })
})
