import { expect, it, describe } from '@jest/globals';
import { TrackingManagerConfig } from '../../src/config/TrackingManagerConfig';
import { CacheStrategy, DEFAULT_SERVER_POOL_MAX_SIZE, DEFAULT_SERVER_TIME_INTERVAL } from '../../src/enum';

describe('test TrackingManagerConfig', () => {
  it('test default construct ', () => {
    const trackingConfig = new TrackingManagerConfig();
    expect(trackingConfig.batchIntervals).toBe(DEFAULT_SERVER_TIME_INTERVAL);
    expect(trackingConfig.poolMaxSize).toBe(DEFAULT_SERVER_POOL_MAX_SIZE);
    expect(trackingConfig.cacheStrategy).toBe(CacheStrategy.PERIODIC_CACHING);
  });

  it('test construct ', () => {
    const trackingConfig = new TrackingManagerConfig({
      batchIntervals: 15,
      cacheStrategy: CacheStrategy.PERIODIC_CACHING,
      poolMaxSize: 21
    });
    expect(trackingConfig.batchIntervals).toBe(15);
    expect(trackingConfig.poolMaxSize).toBe(21);
    expect(trackingConfig.cacheStrategy).toBe(CacheStrategy.PERIODIC_CACHING);
  });

  it('test properties ', () => {
    const trackingConfig = new TrackingManagerConfig();
    trackingConfig.batchIntervals = 15;
    trackingConfig.poolMaxSize = 21;
    expect(trackingConfig.batchIntervals).toBe(15);
    expect(trackingConfig.poolMaxSize).toBe(21);
    expect(trackingConfig.cacheStrategy).toBe(CacheStrategy.PERIODIC_CACHING);
  });
});
