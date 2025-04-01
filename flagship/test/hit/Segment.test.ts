import { expect, it, describe } from '@jest/globals';
import { DecisionApiConfig } from '../../src';
import { CUSTOMER_ENV_ID_API_ITEM, CUSTOMER_UID, DS_API_ITEM, QT_API_ITEM, SDK_APP, T_API_ITEM, VISITOR_ID_API_ITEM } from '../../src/enum';
import { Segment, ERROR_MESSAGE } from '../../src/hit/Segment';

describe('test hit type Campaign', () => {
  const context = { anyKey: 'anyValue' };
  const visitorId = 'visitorID';
  const segmentHit = new Segment({
    context,
    visitorId
  });

  const anonymousId = 'anonymousId';
  const config = new DecisionApiConfig({
    envId: 'envId',
    apiKey: 'apiKey'
  });

  it('test constructor', () => {
    expect(segmentHit.context).toEqual(context);
    expect(segmentHit.getErrorMessage()).toBe(ERROR_MESSAGE);
  });

  it('test isReady method false ', () => {
    expect(segmentHit.isReady()).toBeFalsy();
  });

  it('test isReady method true', () => {
    segmentHit.visitorId = visitorId;
    segmentHit.config = config;
    segmentHit.ds = SDK_APP;
    segmentHit.anonymousId = anonymousId;
    expect(segmentHit.isReady()).toBeTruthy();
    expect(segmentHit.isReady(false)).toBeTruthy();
  });

  const apiKeys: Record<string, unknown> = {
    [VISITOR_ID_API_ITEM]: anonymousId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_UID]: visitorId,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: 'SEGMENT',
    s: context,
    [QT_API_ITEM]: expect.anything()
  };

  it('test toApiKeys method ', () => {
    expect(segmentHit.toApiKeys()).toEqual(apiKeys);
  });

  it('test toObject', () => {
    const userIp = '127.0.0.1';
    const screenResolution = '800X600';
    const locale = 'fr';
    const sessionNumber = '12345';
    const hitKey = 'key';
    segmentHit.userIp = userIp;
    segmentHit.screenResolution = screenResolution;
    segmentHit.locale = locale;
    segmentHit.sessionNumber = sessionNumber;
    segmentHit.key = hitKey;
    expect(segmentHit.toObject()).toEqual({
      userIp,
      screenResolution,
      locale,
      sessionNumber,
      context,
      key: hitKey,
      createdAt: expect.anything(),
      anonymousId,
      ds: SDK_APP,
      type: 'SEGMENT',
      visitorId
    });
  });
});
