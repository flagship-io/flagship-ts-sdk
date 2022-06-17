import { expect, it, describe, jest } from '@jest/globals'
import { TrackingManagerConfig } from '../../src/config/TrackingManagerConfig'
import { BatchStrategy, DEFAULT_BATCH_LENGTH, DEFAULT_TIME_INTERVAL } from '../../src/enum'

describe('test TrackingManagerConfig', () => {
  it('test default construct ', () => {
    const trackingConfig = new TrackingManagerConfig()
    expect(trackingConfig.batchIntervals).toBe(DEFAULT_TIME_INTERVAL)
    expect(trackingConfig.batchLength).toBe(DEFAULT_BATCH_LENGTH)
    expect(trackingConfig.batchStrategy).toBe(BatchStrategy.BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY)
  })

  it('test construct ', () => {
    const trackingConfig = new TrackingManagerConfig({
      batchIntervals: 15,
      batchStrategy: BatchStrategy.BATCHING_WITH_PERIODIC_CACHING_STRATEGY,
      batchLength: 21
    })
    expect(trackingConfig.batchIntervals).toBe(15)
    expect(trackingConfig.batchLength).toBe(21)
    expect(trackingConfig.batchStrategy).toBe(BatchStrategy.BATCHING_WITH_PERIODIC_CACHING_STRATEGY)
  })

  it('test properties ', () => {
    const trackingConfig = new TrackingManagerConfig()
    trackingConfig.batchIntervals = 15
    trackingConfig.batchLength = 21
    expect(trackingConfig.batchIntervals).toBe(15)
    expect(trackingConfig.batchLength).toBe(21)
    expect(trackingConfig.batchStrategy).toBe(BatchStrategy.BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY)
  })
})
