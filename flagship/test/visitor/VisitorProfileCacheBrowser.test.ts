import { jest, expect, it, describe } from '@jest/globals';
import { CLIENT_CACHE_KEY } from '../../src/enum/FlagshipConstant';
import { DecisionApiConfig, VisitorProfile } from '../../src';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import { IVisitorProfileCache } from '../../src/type.local';
import { VisitorProfileCache } from '../../src/visitor/VisitorProfileCache.browser';

describe('VisitorProfileCacheBrowser', () => {
  const logManager = new FlagshipLogManager();
  const logError = jest.spyOn(logManager, 'error');
  const sdkConfig = new DecisionApiConfig();
  sdkConfig.logManager = logManager;
  const mockVisitorProfile:VisitorProfile = {
    visitorId: 'testId',
    anonymousId: 'testAnonymousId'
  };
  let originalLocalStorage: Storage;
  const setItemSpy = jest.fn<Storage['setItem']>();
  const getItemSpy = jest.fn<Storage['getItem']>();

  let cache: IVisitorProfileCache;

  beforeAll(() => {
    originalLocalStorage = global.localStorage;
    Object.defineProperty(global, 'localStorage', {
      value: {
        setItem: setItemSpy,
        getItem: getItemSpy
      },
      writable: true
    });
  });

  beforeEach(() => {
    cache = new VisitorProfileCache(sdkConfig);
  });

  afterEach(() => {
    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });

  afterAll(() => {
    Object.defineProperty(global, 'localStorage', { value: originalLocalStorage });
  });

  it('should save visitor profile to localStorage', () => {
    cache.saveVisitorProfile(mockVisitorProfile);
    expect(setItemSpy).toHaveBeenCalledWith(CLIENT_CACHE_KEY, JSON.stringify(mockVisitorProfile));
  });

  it('should log error if localStorage.setItem throws', () => {
    setItemSpy.mockImplementation(() => {
      throw new Error('Storage error');
    });
    cache.saveVisitorProfile(mockVisitorProfile);
    expect(logError).toHaveBeenCalled();
  });

  it('should load visitor profile from localStorage', () => {
    getItemSpy.mockReturnValue(JSON.stringify(mockVisitorProfile));
    const result = cache.loadVisitorProfile();
    expect(getItemSpy).toHaveBeenCalledWith(CLIENT_CACHE_KEY);
    expect(result).toEqual(mockVisitorProfile);
  });

  it('should log error and return null if localStorage.getItem throws', () => {
    getItemSpy.mockImplementation(() => {
      throw new Error('Get error');
    });
    const result = cache.loadVisitorProfile();
    expect(logError).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should return null if localStorage.getItem returns null', () => {
    getItemSpy.mockReturnValue(null);
    const result = cache.loadVisitorProfile();
    expect(result).toBeNull();
  });
});
