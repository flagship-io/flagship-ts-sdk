import { jest, expect, it, describe, beforeEach, afterEach } from '@jest/globals';
import { Flagship } from '../../src/main/Flagship';
import { VisitorProfile } from '../../src/types';
import { DecisionApiConfig } from '../../src';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import { IVisitorProfileCache } from '../../src/type.local';
import { VisitorProfileCache } from '../../src/visitor/VisitorProfileCache.react-native';

describe('VisitorProfileCacheNode.native', () => {
  const logManager = new FlagshipLogManager();
  const logError = jest.spyOn(logManager, 'error');
  const sdkConfig = new DecisionApiConfig();
  sdkConfig.logManager = logManager;

  Flagship.newVisitor({ hasConsented: true });

  const extendedFlagship = Flagship as {
    setVisitorProfile?: (value: string|null) => void,
    getVisitorProfile?: () => string|null,
    setOnSaveVisitorProfile?: (value: (visitorProfile:string)=>void) => void,
    getOnSaveVisitorProfile?: () => (visitorProfile:string)=>void
  };

  const mockGetOnSaveVisitorProfile = jest.spyOn(extendedFlagship, 'getOnSaveVisitorProfile');
  const mockGetVisitorProfile = jest.spyOn(extendedFlagship, 'getVisitorProfile');

  let cache: IVisitorProfileCache;
  const mockVisitorProfile: VisitorProfile = {
    visitorId: 'testId',
    anonymousId: 'testAnonymousId'
  };

  beforeEach(() => {
    cache = new VisitorProfileCache(sdkConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveVisitorProfile', () => {
    it('should call getOnSaveVisitorProfile and save the visitor profile', () => {
      const mockOnSave = jest.fn();
      mockGetOnSaveVisitorProfile.mockReturnValue(mockOnSave);

      cache.saveVisitorProfile(mockVisitorProfile);

      expect(mockGetOnSaveVisitorProfile).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalledWith(JSON.stringify(mockVisitorProfile));
    });

    it('should log error if getOnSaveVisitorProfile throws an error', () => {
      const errorMessage = 'Save error';
      mockGetOnSaveVisitorProfile.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      cache.saveVisitorProfile(mockVisitorProfile);

      expect(logError).toHaveBeenCalledWith(
        errorMessage,
        'VisitorProfileCache.saveVisitorProfile'
      );
    });

    it('should log error if onSaveVisitorProfile throws an error', () => {
      const mockOnSave = jest.fn(() => {
        throw new Error('OnSave error');
      });
      mockGetOnSaveVisitorProfile.mockReturnValue(mockOnSave);

      cache.saveVisitorProfile(mockVisitorProfile);

      expect(logError).toHaveBeenCalledWith(
        'OnSave error',
        'VisitorProfileCache.saveVisitorProfile'
      );
    });
  });

  describe('loadVisitorProfile', () => {
    it('should load and parse the visitor profile', () => {
      mockGetVisitorProfile.mockReturnValue(JSON.stringify(mockVisitorProfile));

      const result = cache.loadVisitorProfile();

      expect(mockGetVisitorProfile).toHaveBeenCalled();
      expect(result).toEqual(mockVisitorProfile);
    });

    it('should return null if getVisitorProfile returns null', () => {
      mockGetVisitorProfile.mockReturnValue(null);

      const result = cache.loadVisitorProfile();

      expect(mockGetVisitorProfile).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should log error if getVisitorProfile throws an error and return null', () => {
      const errorMessage = 'Load error';
      mockGetVisitorProfile.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const result = cache.loadVisitorProfile();

      expect(logError).toHaveBeenCalledWith(
        errorMessage,
        'VisitorProfileCache.loadVisitorProfile'
      );
      expect(result).toBeNull();
    });

    it('should log error if JSON.parse throws an error and return null', () => {
      mockGetVisitorProfile.mockReturnValue('invalid json');

      const result = cache.loadVisitorProfile();

      expect(logError).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
