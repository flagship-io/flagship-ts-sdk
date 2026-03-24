import { expect, it, describe } from '@jest/globals';
import { TrackingManager } from '../../src/api/TrackingManager';
import { ConfigManager, DecisionApiConfig } from '../../src/config/index';
import { ApiManager } from '../../src/decision/ApiManager';
import { IHttpClient } from '../../src/utils/HttpClient';

describe('ConfigManager', () => {
  const config = {} as DecisionApiConfig;
  const decisionManager = {} as ApiManager;
  const trackingManager = {} as TrackingManager;
  const configManager = new ConfigManager(
    config,
    decisionManager,
    trackingManager
  );

  it('should initialize with correct config, decisionManager, and trackingManager properties', () => {
    expect(configManager.config).toBe(config);
    expect(configManager.decisionManager).toBe(decisionManager);
    expect(configManager.trackingManager).toBe(trackingManager);
  });

  it('should update config property when set', () => {
    const config2 = new DecisionApiConfig();
    configManager.config = config2;
    expect(configManager.config).toBe(config2);
  });

  it('should update decisionManager property when set', () => {
    const decisionManager2 = new ApiManager({
      httpClient: {} as IHttpClient,
      config: {} as DecisionApiConfig,
      trackingManager: {} as TrackingManager
    });
    configManager.decisionManager = decisionManager2;
    expect(configManager.decisionManager).toBe(decisionManager2);
  });

  it('should update trackingManager property when set', () => {
    const trackingManager2 = new TrackingManager(
      {} as IHttpClient,
      {} as DecisionApiConfig
    );
    configManager.trackingManager = trackingManager2;
    expect(configManager.trackingManager).toBe(trackingManager2);
  });
});
