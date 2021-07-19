import { assertEquals, stub, Stub } from "../../deps.ts";
import { CATEGORY_ERROR, ERROR_MESSAGE } from "../../src/hit/Event.ts";
import { Event, EventCategory } from "../../src/hit/index.ts";
import { DecisionApiConfig } from "../../src/config/index.ts";
import {
  CUSTOMER_ENV_ID_API_ITEM,
  DS_API_ITEM,
  EVENT_ACTION_API_ITEM,
  EVENT_CATEGORY_API_ITEM,
  EVENT_LABEL_API_ITEM,
  EVENT_VALUE_API_ITEM,
  HitType,
  SDK_APP,
  TYPE_ERROR,
  T_API_ITEM,
  VISITOR_ID_API_ITEM,
} from "../../src/enum/index.ts";
import { FlagshipLogManager } from "../../src/utils/FlagshipLogManager.ts";
import { sprintf } from "../../src/utils/utils.ts";

// deno-lint-ignore no-explicit-any
const getNull = (): any => {
  return null;
};
Deno.test("test hit type Event", () => {
  const category = EventCategory.ACTION_TRACKING;
  const action = "action";
  const event = new Event(category, action);

  assertEquals(event.category, category);
  assertEquals(event.action, action);
  assertEquals(event.config, undefined);
  assertEquals(event.ds, undefined);
  assertEquals(event.eventLabel, undefined);
  assertEquals(event.eventValue, undefined);
  assertEquals(event.visitorId, undefined);
  assertEquals(event.getErrorMessage(), ERROR_MESSAGE);

  //test isReady method
  assertEquals(event.isReady(), false);

  //test set config
  const logManager = new FlagshipLogManager();
  const logError: Stub<FlagshipLogManager> = stub(logManager, "error");

  const config = new DecisionApiConfig("envId", "apiKey");
  config.logManager = logManager;

  event.config = config;

  assertEquals(event.config, config);

  //test isReady method
  assertEquals(event.isReady(), false);

  //test set ds
  event.ds = SDK_APP;
  assertEquals(event.ds, SDK_APP);

  //test isReady method
  assertEquals(event.isReady(), false);

  //test visitorId
  const visitorId = "visitorId";
  event.visitorId = visitorId;

  assertEquals(event.visitorId, visitorId);

  //test isReady method
  assertEquals(event.isReady(), true);

  // deno-lint-ignore no-explicit-any
  const apiKeys: any = {
    [VISITOR_ID_API_ITEM]: visitorId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.EVENT,
    [EVENT_CATEGORY_API_ITEM]: category,
    [EVENT_ACTION_API_ITEM]: action,
  };

  assertEquals(event.toApiKeys(), apiKeys);

  //test eventLabel
  const label = "label";
  event.eventLabel = label;
  assertEquals(event.eventLabel, label);

  apiKeys[EVENT_LABEL_API_ITEM] = label;

  assertEquals(event.toApiKeys(), apiKeys);

  event.eventLabel = getNull();

  assertEquals(event.eventLabel, label);

  assertEquals(logError.calls.length, 1);

  //test set eventValue
  const value = 122;
  event.eventValue = value;
  assertEquals(event.eventValue, value);
  apiKeys[EVENT_VALUE_API_ITEM] = value;
  assertEquals(event.toApiKeys(), apiKeys);

  event.eventValue = {} as number;
  assertEquals(event.eventValue, value);

  assertEquals(logError.calls.length, 2);

  //test log category

  event.category = {} as EventCategory;
  assertEquals(event.category, category);
  assertEquals(logError.calls.length, 3);

  //test log action

  event.action = "";
  assertEquals(event.action, action);

  //test log
  assertEquals(logError.calls, [
    {
      args: [sprintf(TYPE_ERROR, "eventLabel", "string"), "eventLabel"],
      self: logManager,
    },
    {
      args: [sprintf(TYPE_ERROR, "eventValue", "number"), "eventValue"],
      self: logManager,
    },
    {
      args: [CATEGORY_ERROR, "category"],
      self: logManager,
    },
    {
      args: [sprintf(TYPE_ERROR, "action", "string"), "action"],
      self: logManager,
    },
  ]);
});
