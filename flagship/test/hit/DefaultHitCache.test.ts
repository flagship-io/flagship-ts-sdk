import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals';
import { HitCacheDTO, HitType } from '../../src';
import { DefaultHitCache, FS_HIT_PREFIX } from '../../src/cache/DefaultHitCache';
import { HIT_CACHE_VERSION } from '../../src/enum';
import { Screen } from '../../src/hit/Screen';

describe('Test DefaultHitCache', () => {
  const methodNow = Date.now;
  const mockNow = jest.fn<typeof Date.now>();
  beforeAll(() => {
    Date.now = mockNow;
    mockNow.mockReturnValue(1);
  });
  afterAll(() => {
    Date.now = methodNow;
  });

  const defaultHitCache = new DefaultHitCache();
  const storageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn<(items: string[])=>void>()

  };

  global.localStorage = storageMock as any;
  const visitorId = 'visitorId';

  const pageHit = new Screen({
    documentLocation: 'home',
    visitorId
  });
  const visitorData : HitCacheDTO = {
    version: HIT_CACHE_VERSION,
    data: {
      visitorId,
      anonymousId: null,
      type: HitType.SCREEN,

      content: pageHit.toObject() as any,
      time: Date.now()
    }
  };

  it('test cacheHit ', async () => {
    const hits = { [visitorId]: visitorData };
    await defaultHitCache.cacheHit(hits);
    expect(global.localStorage.setItem).toBeCalledTimes(1);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(FS_HIT_PREFIX, JSON.stringify(hits));
  });
  it('test cacheHit', async () => {
    const hitStored = { [visitorId + '_1']: visitorData };
    const hits = { [visitorId]: visitorData };
    storageMock.getItem.mockReturnValue(JSON.stringify(hitStored));
    await defaultHitCache.cacheHit(hits);
    expect(global.localStorage.setItem).toBeCalledTimes(1);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(FS_HIT_PREFIX, JSON.stringify({
      ...hitStored,
      ...hits
    }));
  });
  it('test flushHits', async () => {
    const hitStored = { [visitorId + '_1']: visitorData };
    const hits = { [visitorId]: visitorData };

    storageMock.getItem.mockReturnValue(JSON.stringify({
      ...hitStored,
      ...hits
    }));

    await defaultHitCache.flushHits([visitorId]);

    expect(global.localStorage.setItem).toBeCalledTimes(1);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(FS_HIT_PREFIX, JSON.stringify(hitStored));
  });

  it('test flushHits', async () => {
    storageMock.getItem.mockReturnValue(null);

    await defaultHitCache.flushHits([visitorId]);

    expect(global.localStorage.setItem).toBeCalledTimes(1);
    expect(global.localStorage.setItem).toHaveBeenCalledWith(FS_HIT_PREFIX, JSON.stringify({}));
  });

  it('test flushAllHits', async () => {
    storageMock.removeItem.mockReturnValue();

    await defaultHitCache.flushAllHits();

    expect(global.localStorage.removeItem).toBeCalledTimes(1);
    expect(global.localStorage.removeItem).toHaveBeenCalledWith(FS_HIT_PREFIX);
  });

  it('test lookupHits', async () => {
    const hits = { [visitorId]: visitorData };
    storageMock.getItem.mockReturnValue(JSON.stringify(hits));
    const data = await defaultHitCache.lookupHits();
    expect(data).toEqual(hits);
  });
  it('test lookupHits', async () => {
    storageMock.getItem.mockReturnValue(null);
    const data = await defaultHitCache.lookupHits();
    expect(data).toEqual({});
  });
});
