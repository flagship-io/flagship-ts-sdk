import { TrackingManager } from '../../src/api/TrackingManager';
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig';
import { EmotionAI } from '../../src/emotionAI/EmotionAI.node';
import { IHttpClient, IHttpOptions, IHttpResponse } from '../../src/utils/HttpClient';
import { jest } from '@jest/globals';

describe('EmotionAI', () => {
  const getAsyncSpy = jest.fn<(url: string, options?: IHttpOptions) => Promise<IHttpResponse>>();
  const postAsyncSpy = jest.fn<(url: string, options: IHttpOptions) => Promise<IHttpResponse>>();
  const sdkConfig = new DecisionApiConfig({
    envId: 'env',
    apiKey: 'api'
  });

  const httpClient :IHttpClient = {
    getAsync: getAsyncSpy,
    postAsync: postAsyncSpy
  };
  const emotionAI = new EmotionAI({
    httpClient,
    sdkConfig,
    eAIConfig: {
      eaiActivationEnabled: true,
      eaiCollectEnabled: true
    }
  });

  const trackingManager = new TrackingManager(httpClient, sdkConfig);

  const addHit = jest.spyOn(trackingManager, 'addHit');
  addHit.mockResolvedValue();

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag');
  activateFlag.mockResolvedValue();

  emotionAI.init();

  it('should fetchEAIScore return a undefined', async () => {
    const result = await emotionAI.fetchEAIScore();
    expect(result).toBeUndefined();
    expect(getAsyncSpy).not.toHaveBeenCalled();
  });

  it('should reportVisitorEvent', async () => {
    await emotionAI.reportVisitorEvent();
    expect(postAsyncSpy).not.toHaveBeenCalled();
  });

  it('should cleanup', () => {
    emotionAI.cleanup();
  });

  it('should collectEAIData', async () => {
    await emotionAI.collectEAIEventsAsync();
    expect(getAsyncSpy).not.toHaveBeenCalled();
    expect(postAsyncSpy).not.toHaveBeenCalled();
  });
});
