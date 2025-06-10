import { IDecisionManager } from './../../src/decision/IDecisionManager';
import { EdgeConfig } from './../../src/config/EdgeConfig';
import { EdgeManager } from './../../src/decision/EdgeManager';
import { it, describe, jest } from '@jest/globals';
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate';
import { HttpClient } from '../../src/utils/HttpClient';
import { MurmurHash } from '../../src/utils/MurmurHash';
import { TrackingManager } from '../../src/api/TrackingManager';
import { ISdkManager } from '../../src/main/ISdkManager';
import { BucketingDTO, CampaignDTO } from '../../src/types';
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract';
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI';
import { bucketing } from './bucketing';

describe('Test EdgeManager', () => {
  const murmurHash = new MurmurHash();
  const httpClient = new HttpClient();
  const config = new EdgeConfig();

  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>();

  const sdkManager = { getBucketingContent } as unknown as ISdkManager;

  getBucketingContent.mockReturnValue(undefined);

  const trackingManager = new TrackingManager(httpClient, config);

  const edgeManager = new EdgeManager({
    httpClient,
    config,
    murmurHash,
    sdkManager,
    trackingManager
  });

  const emotionAi = { init: jest.fn<(visitor:VisitorAbstract) => void>() } as unknown as IEmotionAI;

  const visitor = new VisitorDelegate({
    hasConsented: true,
    visitorId: 'visitor_1',
    context: { age: 20 },
    configManager: {
      config,
      decisionManager: {} as IDecisionManager,
      trackingManager
    },
    emotionAi
  });
  it('test getCampaign', async () => {
    getBucketingContent.mockReturnValue(bucketing);
    // getCampaignsAsync.mockResolvedValue(null)
    const campaigns = await edgeManager.getCampaignsAsync(visitor);
    const modifications = edgeManager.getModifications(campaigns as CampaignDTO[]);
    expect(modifications.size).toBe(6);
  });
});
