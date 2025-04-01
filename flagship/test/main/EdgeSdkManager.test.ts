import { jest, describe, it, expect } from '@jest/globals';
import { HttpClient } from '../../src/utils/HttpClient';
import { TrackingManager } from '../../src/api/TrackingManager';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import { bucketing } from './bucketing';
import { BucketingConfig } from '../../src/config';
import { EdgeSdkManager } from '../../src/main/EdgeSdkManager';

describe('EdgeSdkManager', () => {
  const httpClient = new HttpClient();
  const sdkConfig = new BucketingConfig({
    envId: 'envId',
    apiKey: 'apiKey',
    pollingInterval: 0
  });
  const trackingManager = new TrackingManager(httpClient, sdkConfig);
  const edgeSdkManager = new EdgeSdkManager({
    httpClient,
    sdkConfig,
    trackingManager,
    flagshipInstanceId: 'flagshipInstanceId'
  });
  const logManager = new FlagshipLogManager();
  sdkConfig.logManager = logManager;

  const getAsyncSpy = jest.spyOn(httpClient, 'getAsync');

  it('resetSdk should set _EAIConfig to undefined', () => {
    expect(edgeSdkManager.getEAIConfig()).toBeUndefined();
  });

  it('getBucketingContent should return undefined', () => {
    const result = edgeSdkManager.getBucketingContent();
    expect(result).toBeUndefined();
  });

  describe('initSdk', () => {
    it('should fetch and set EAIConfig successfully', async () => {
      getAsyncSpy.mockResolvedValue({
        body: bucketing,
        status: 200
      });

      await edgeSdkManager.initSdk();

      expect(getAsyncSpy).toHaveBeenCalledTimes(0);

      expect(edgeSdkManager.getEAIConfig()).toBeUndefined();
      expect(edgeSdkManager.getBucketingContent()).toBeUndefined();

      edgeSdkManager.resetSdk();
      expect(edgeSdkManager.getEAIConfig()).toBeUndefined();
      expect(edgeSdkManager.getBucketingContent()).toBeUndefined();
    });
  });
});

describe('EdgeSdkManager with initialBucketing', () => {
  const httpClient = new HttpClient();
  const sdkConfig = new BucketingConfig({
    envId: 'envId',
    apiKey: 'apiKey',
    pollingInterval: 0,
    initialBucketing: bucketing
  });
  const trackingManager = new TrackingManager(httpClient, sdkConfig);
  const edgeSdkManager = new EdgeSdkManager({
    httpClient,
    sdkConfig,
    trackingManager,
    flagshipInstanceId: 'flagshipInstanceId'
  });
  const logManager = new FlagshipLogManager();
  sdkConfig.logManager = logManager;

  it('getBucketingContent should return initialBucketing', () => {
    const result = edgeSdkManager.getBucketingContent();
    expect(result).toEqual(bucketing);
    expect(edgeSdkManager.getEAIConfig()).toBeUndefined();
  });
});
