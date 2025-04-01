import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals';
import { CATEGORY_ERROR, ERROR_MESSAGE, VALUE_FIELD_ERROR, Event } from '../../src/hit/Event';
import { EventCategory } from '../../src/hit/index';
import { DecisionApiConfig } from '../../src/config/index';
import { CUSTOMER_ENV_ID_API_ITEM,
  CUSTOMER_UID,
  DS_API_ITEM,
  EVENT_ACTION_API_ITEM,
  EVENT_CATEGORY_API_ITEM,
  EVENT_LABEL_API_ITEM,
  EVENT_VALUE_API_ITEM,
  HitType,
  QA_MODE_API_ITEM,
  QT_API_ITEM,
  SDK_APP,
  TYPE_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM } from '../../src/enum/index';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import { sprintf } from '../../src/utils/utils';


const getNull = (): any => {
  return null;
};

describe('test hit type Event', () => {
  const methodNow = Date.now;
  const mockNow = jest.fn<typeof Date.now>();
  const visitorId = 'visitorId';
  beforeAll(() => {
    Date.now = mockNow;
    mockNow.mockReturnValue(1);
  });
  afterAll(() => {
    Date.now = methodNow;
  });

  describe('test constructor ', () => {
    it('test constructor with all params', () => {
      const params = {
        action: 'action',
        category: EventCategory.ACTION_TRACKING,
        label: 'label',
        value: 12,
        userIp: '127.0.0.1',
        screenResolution: '800X600',
        locale: 'fr',
        sessionNumber: '12345',
        visitorId,
        qaMode: true
      };

      const event = new Event(params);
      expect(event.category).toBe(params.category);
      expect(event.action).toBe(params.action);
      expect(event.label).toBe(params.label);
      expect(event.value).toBe(params.value);
      expect(event.userIp).toBe(params.userIp);
      expect(event.screenResolution).toBe(params.screenResolution);
      expect(event.locale).toBe(params.locale);
      expect(event.sessionNumber).toBe(params.sessionNumber);
      expect(event.qaMode).toBe(params.qaMode);
    });

    it('test constructor with basic params', () => {
      const category = EventCategory.ACTION_TRACKING;
      const action = 'action';
      const event = new Event({
        category,
        action,
        visitorId
      });
      expect(event.category).toBe(category);
      expect(event.action).toBe(action);
      expect(event.config).toBeUndefined();
      expect(event.ds).toBe(SDK_APP);
      expect(event.label).toBeUndefined();
      expect(event.value).toBeUndefined();
      expect(event.visitorId).toBe(visitorId);
      expect(event.anonymousId).toBeNull();
      expect(event.getErrorMessage()).toBe(ERROR_MESSAGE);
      expect(event.userIp).toBeUndefined();
      expect(event.screenResolution).toBeUndefined();
      expect(event.locale).toBeUndefined();
      expect(event.sessionNumber).toBeUndefined();
      expect(event.qaMode).toBeUndefined();
    });
  });

  describe('test isReady method', () => {
    const category = EventCategory.ACTION_TRACKING;
    const action = 'action';
    const event = new Event({
      category,
      action,
      visitorId
    });
    event.qaMode = true;

    it('test isReady method ', () => {
      expect(event.isReady()).toBeFalsy();
    });

    const logManager = new FlagshipLogManager();
    const logError = jest.spyOn(logManager, 'error');
    const config = new DecisionApiConfig({
      envId: 'envId',
      apiKey: 'apiKey'
    });
    config.logManager = logManager;

    it('test isReady method ', () => {
      expect(event.isReady()).toBeFalsy();
    });
    it('test set config ', () => {
      event.config = config;
      expect(event.config).toBe(config);
    });

    it('test set ds', () => {
      event.ds = SDK_APP;
      expect(event.ds).toBe(SDK_APP);
    });

    it('test visitorId', () => {
      event.visitorId = visitorId;
      expect(event.visitorId).toBe(visitorId);
    });

    const anonymousId = 'anonymousId';
    it('test visitorId', () => {
      event.anonymousId = anonymousId;
      expect(event.anonymousId).toBe(anonymousId);
    });

    it('test isReady method', () => {
      expect(event.isReady()).toBeTruthy();
      expect(event.isReady(false)).toBeTruthy();
    });


    const apiKeys: Record<string, unknown> = {
      [VISITOR_ID_API_ITEM]: anonymousId,
      [DS_API_ITEM]: SDK_APP,
      [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
      [T_API_ITEM]: HitType.EVENT,
      [EVENT_CATEGORY_API_ITEM]: category,
      [EVENT_ACTION_API_ITEM]: action,
      [CUSTOMER_UID]: visitorId,
      [QT_API_ITEM]: expect.anything(),
      [QA_MODE_API_ITEM]: true
    };

    it('should ', () => {
      expect(event.toApiKeys()).toEqual(apiKeys);
    });

    it('test apiKey with anonymousId null', () => {
      event.anonymousId = null;
      apiKeys[CUSTOMER_UID] = null;
      apiKeys[VISITOR_ID_API_ITEM] = visitorId;
      expect(event.toApiKeys()).toEqual(apiKeys);
    });

    const label = 'label';
    // test label
    it('test label ', () => {
      event.label = label;
      expect(event.label).toBe(label);
      apiKeys[EVENT_LABEL_API_ITEM] = label;

      expect(event.toApiKeys()).toEqual(apiKeys);

      event.label = getNull();

      expect(logError).toHaveBeenCalledWith(
        sprintf(TYPE_ERROR, 'label', 'string'),
        'label'
      );
      expect(event.label).toBe(label);
      expect(logError).toHaveBeenCalledTimes(1);
    });

    const value = 122;
    // test set value
    it('test set value', () => {
      event.value = value;
      expect(event.value).toBe(value);
      apiKeys[EVENT_VALUE_API_ITEM] = value;

      expect(event.toApiKeys()).toEqual(apiKeys);

      event.value = {} as number;
      expect(logError).toBeCalledWith(
        VALUE_FIELD_ERROR,
        'value'
      );
      expect(event.value).toBe(value);

      event.value = 2.5;
      expect(logError).toBeCalledWith(
        VALUE_FIELD_ERROR,
        'value'
      );
      expect(event.value).toBe(value);

      event.value = -20;
      expect(logError).toBeCalledWith(
        VALUE_FIELD_ERROR,
        'value'
      );
      expect(event.value).toBe(value);
      expect(logError).toHaveBeenCalledTimes(3);
    });

    it('test toObject', () => {
      const userIp = '127.0.0.1';
      const screenResolution = '800X600';
      const locale = 'fr';
      const sessionNumber = '12345';
      const hitKey = 'key';
      event.userIp = userIp;
      event.screenResolution = screenResolution;
      event.locale = locale;
      event.sessionNumber = sessionNumber;
      event.key = hitKey;

      expect(event.toObject()).toEqual({
        action,
        userIp,
        screenResolution,
        locale,
        sessionNumber,
        label,
        key: hitKey,
        createdAt: expect.anything(),
        value,
        anonymousId: null,
        category,
        ds: SDK_APP,
        type: HitType.EVENT,
        visitorId,
        qaMode: true
      });
    });

    it('test log category', () => {
      event.category = {} as EventCategory;
      expect(event.category).toBe(category);
      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toBeCalledWith(CATEGORY_ERROR, 'category');
    });

    it('test log action ', () => {
      event.action = '';
      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toBeCalledWith(
        sprintf(TYPE_ERROR, 'action', 'string'),
        'action'
      );
      expect(event.action).toBe(action);
    });

    it('test log action ', () => {
      const category = EventCategory.ACTION_TRACKING;
      const action = 'action';
      const event2 = new Event({
        category,
        action,
        visitorId
      });
      event2.config = config;
      event2.visitorId = visitorId;

      const apiKeys: Record<string, unknown> = {
        [VISITOR_ID_API_ITEM]: visitorId,
        [DS_API_ITEM]: SDK_APP,
        [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
        [T_API_ITEM]: HitType.EVENT,
        [EVENT_CATEGORY_API_ITEM]: category,
        [EVENT_ACTION_API_ITEM]: action,
        [CUSTOMER_UID]: null,
        [QT_API_ITEM]: expect.anything()
      };

      expect(event2.toApiKeys()).toEqual(apiKeys);
    });
  });
});
