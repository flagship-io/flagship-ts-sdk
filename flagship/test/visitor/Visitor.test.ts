import { assertEquals, assertExists, stub } from "../../deps.ts";
import { TrackingManager } from "../../src/api/TrackingManager.ts";
import { ConfigManager, DecisionApiConfig } from "../../src/config/index.ts";
import { ApiManager } from "../../src/decision/ApiManager.ts";
import {
  CONTEXT_NULL_ERROR,
  CONTEXT_PARAM_ERROR,
  GET_MODIFICATION_CAST_ERROR,
  GET_MODIFICATION_ERROR,
  GET_MODIFICATION_KEY_ERROR,
  GET_MODIFICATION_MISSING_ERROR,
  PANIC_MODE_ERROR,
  PROCESS_ACTIVE_MODIFICATION,
  PROCESS_GET_MODIFICATION,
  PROCESS_GET_MODIFICATION_INFO,
  PROCESS_SEND_HIT,
  PROCESS_UPDATE_CONTEXT,
  TRACKER_MANAGER_MISSING_ERROR,
  VISITOR_ID_ERROR,
} from "../../src/enum/index.ts";
import { Screen } from "../../src/hit/index.ts";
import { Modification } from "../../src/model/Modification.ts";
import { FlagshipLogManager } from "../../src/utils/FlagshipLogManager.ts";
import { IHttpClient } from "../../src/utils/httpClient.ts";
import { sprintf } from "../../src/utils/utils.ts";
import { Visitor } from "../../src/visitor/Visitor.ts";
import { returnModification } from "./modification.ts";

// deno-lint-ignore no-explicit-any
const getNull = (): any => {
  return null;
};

Deno.test("test visitor", async () => {
  const visitorId = "visitorId";
  // deno-lint-ignore no-explicit-any
  const context: any = {};

  const logManager = new FlagshipLogManager();
  const logError = stub(logManager, "error");

  const config = new DecisionApiConfig("envId", "apiKey");
  config.logManager = logManager;

  const apiManager = new ApiManager({} as IHttpClient, config);

  const getCampaignsModificationsAsync = stub(
    apiManager,
    "getCampaignsModificationsAsync"
  );

  const isPanic = stub(apiManager, "isPanic");

  const trackingManager = new TrackingManager({} as IHttpClient, config);

  const sendActive = stub(trackingManager, "sendActive");
  const sendHit = stub(trackingManager, "sendHit");

  const configManager = new ConfigManager(config, apiManager, trackingManager);

  const visitor = new Visitor(visitorId, context, configManager);

  assertEquals(visitor.visitorId, visitorId);
  assertEquals(visitor.config, config);
  assertEquals(visitor.configManager, configManager);
  assertEquals(visitor.context, {});
  assertExists(visitor.modifications);
  assertEquals(visitor.modifications.size, 0);

  //test invalid visitor id
  visitor.visitorId = {} as string;
  assertEquals(visitor.visitorId, visitorId);

  visitor.visitorId = getNull();
  assertEquals(visitor.visitorId, visitorId);

  visitor.visitorId = "";
  assertEquals(visitor.visitorId, visitorId);

  const logParams = (message: string, tag: string) => ({
    args: [message, tag],
    self: logManager,
  });

  const visitorLog = logParams(VISITOR_ID_ERROR, "VISITOR ID");

  //test updateContextKeyValue
  visitor.updateContextKeyValue("age", 20);
  visitor.updateContextKeyValue("currency", "EUR");
  visitor.updateContextKeyValue("isVip", true);
  const expectContext = { age: 20, currency: "EUR", isVip: true };
  assertEquals(visitor.context, expectContext);

  //test updateContextKeyValue invalid value
  const keyNewField = "newField";
  visitor.updateContextKeyValue(keyNewField, {} as string);

  //test updateContextKeyValue invalid key
  visitor.updateContextKeyValue({} as string, "value");

  const updateContextKeyValueLog = logParams(
    sprintf(CONTEXT_PARAM_ERROR, keyNewField),
    PROCESS_UPDATE_CONTEXT
  );

  const updateContextKeyValueLogKey = logParams(
    sprintf(CONTEXT_PARAM_ERROR, {}),
    PROCESS_UPDATE_CONTEXT
  );

  //test updateContext
  const newContext = {
    local: "fr",
    color: "red",
  };

  visitor.updateContext(newContext);
  assertEquals(visitor.context, { ...expectContext, ...newContext });

  //test updateContext with null

  visitor.updateContext(getNull());
  const updateContextLog = logParams(
    CONTEXT_NULL_ERROR,
    PROCESS_UPDATE_CONTEXT
  );

  //test set context
  const setNewContext = {
    "car-color": "blue",
  };
  visitor.context = setNewContext;
  assertEquals(visitor.context, setNewContext);

  //test clear Context
  visitor.clearContext();
  assertEquals(visitor.context, {});

  //test synchronizeModifications

  getCampaignsModificationsAsync.returns = [returnModification];

  await visitor.synchronizeModifications();

  assertEquals(getCampaignsModificationsAsync.calls, [
    {
      args: [visitor],
      self: apiManager,
      returned: returnModification,
    },
  ]);

  //test getModification

  const testModificationType = async <T>(
    key: string,
    defaultValue: T,
    activate = false
  ) => {
    const returnMod = returnModification.get(key) as Modification;
    const modification = await visitor.getModificationAsync(
      returnMod.key,
      defaultValue,
      activate
    );
    assertEquals<T>(modification, returnMod.value);
  };

  const testModificationErrorCast = <T>(
    key: string,
    defaultValue: T,
    activate = false
  ) => {
    const returnMod = returnModification.get(key) as Modification;
    const modification = visitor.getModification(
      returnMod.key,
      defaultValue,
      activate
    );
    assertEquals<T>(modification, defaultValue);
  };

  const testModificationWithDefault = <T>(
    key: string,
    defaultValue: T,
    activate = false
  ) => {
    const modification = visitor.getModification(key, defaultValue, activate);
    assertEquals<T>(modification, defaultValue);
  };

  //key string
  testModificationType("keyString", "defaultString");

  //key keyNumber
  testModificationType("keyNumber", 10);

  //key keyBoolean
  testModificationType("keyBoolean", false);

  //key array
  testModificationType("array", []);

  //key object
  testModificationType("object", {});

  //key complex
  testModificationType("complex", {});

  //key string with activate
  testModificationType("keyString", "defaultString", true);

  const keyStringActivateParams = {
    args: [visitor, returnModification.get("keyString")],
    self: trackingManager,
  };

  //test key not exist
  const notExitKey = "notExitKey";
  testModificationWithDefault(notExitKey, "defaultValue");

  const keyNotExistLog = logParams(
    sprintf(GET_MODIFICATION_MISSING_ERROR, notExitKey),
    PROCESS_GET_MODIFICATION
  );

  //test typeof key != defaultValue

  const keyCastLog = (key: string) =>
    logParams(
      sprintf(GET_MODIFICATION_CAST_ERROR, key),
      PROCESS_GET_MODIFICATION
    );

  testModificationErrorCast("keyString", 10);

  testModificationErrorCast("array", 10);

  testModificationErrorCast("array", {});
  testModificationErrorCast("object", []);

  //test typeof key != defaultValue with activate and modification value = null
  testModificationErrorCast("keyNull", [], true);

  const keyObjectActivateParams = {
    args: [visitor, returnModification.get("keyNull")],
    self: trackingManager,
  };

  //test key == null or key != string

  testModificationWithDefault({} as string, "defaultValue");

  const keyInvalid = logParams(
    sprintf(GET_MODIFICATION_KEY_ERROR, {}),
    PROCESS_GET_MODIFICATION
  );

  //test getModification panic mode

  isPanic.returns = [true];

  testModificationWithDefault("key", "defaultValue");

  const panicModeLog = (functionName: string) =>
    logParams(sprintf(PANIC_MODE_ERROR, functionName), functionName);

  //test getModificationInfo
  const returnMod = returnModification.get("keyString") as Modification;
  let modification = visitor.getModificationInfo(returnMod.key);
  assertEquals(modification, returnMod);

  //test key not exist in getModificationInfo
  modification = visitor.getModificationInfo(notExitKey);
  assertEquals(modification, null);

  //test key is not valid in getModificationInfo
  modification = visitor.getModificationInfo(getNull());
  assertEquals(modification, null);

  //test panic mode getModificationInfo
  isPanic.returns = [true];
  modification = visitor.getModificationInfo(returnMod.key);
  assertEquals(modification, null);

  const getKeyNotExistLog = (key: string, tag: string) =>
    logParams(sprintf(GET_MODIFICATION_ERROR, key), tag);

  const getKeyInvalidLog = (key: string, tag: string) =>
    logParams(sprintf(GET_MODIFICATION_KEY_ERROR, key), tag);

  //test getModificationInfoAsync

  modification = await visitor.getModificationInfoAsync(returnMod.key);
  assertEquals(modification, returnMod);

  // test activateModification
  visitor.activateModification(returnMod.key);

  //test invalid key in activateModification
  visitor.activateModification(getNull());

  //test key not exist in activateModification
  visitor.activateModification(notExitKey);

  //test panic mode activateModification
  isPanic.returns = [true];
  visitor.activateModification(returnMod.key);

  //test hasTrackingManager activateModification

  configManager.trackingManager = getNull();

  visitor.activateModification(returnMod.key);

  const trackingManagerCheck = (tag: string) =>
    logParams(TRACKER_MANAGER_MISSING_ERROR, tag);

  configManager.trackingManager = trackingManager;
  //test activateModificationAsync

  await visitor.activateModificationAsync(returnMod.key);

  //test sendHit
  const hitScreen = new Screen("home");

  visitor.sendHit(hitScreen);

  //test hasTrackingManager activateModification

  configManager.trackingManager = getNull();
  visitor.sendHit(hitScreen);

  configManager.trackingManager = trackingManager;

  //panic mode sendHit
  isPanic.returns = [true];
  visitor.sendHit(hitScreen);

  //test isReady sendHit
  const hitScreenNull = new Screen(getNull());
  visitor.sendHit(hitScreenNull);

  const hitIsReadyLog = logParams(
    hitScreen.getErrorMessage(),
    PROCESS_SEND_HIT
  );

  //test sendHitAsync
  await visitor.sendHitAsync(hitScreen);

  assertEquals(sendHit.calls, [
    {
      args: [hitScreen],
      self: trackingManager,
    },
    {
      args: [hitScreen],
      self: trackingManager,
    },
  ]);

  assertEquals(sendActive.calls, [
    keyStringActivateParams,
    keyObjectActivateParams,
    keyStringActivateParams,
    keyStringActivateParams,
  ]);

  assertEquals(logError.calls, [
    visitorLog,
    visitorLog,
    visitorLog,
    updateContextKeyValueLog,
    updateContextKeyValueLogKey,
    updateContextLog,
    keyNotExistLog,
    keyCastLog("keyString"),
    keyCastLog("array"),
    keyCastLog("array"),
    keyCastLog("object"),
    keyCastLog("keyNull"),
    keyInvalid,
    panicModeLog(PROCESS_GET_MODIFICATION),
    getKeyNotExistLog(notExitKey, PROCESS_GET_MODIFICATION_INFO),
    getKeyInvalidLog(getNull(), PROCESS_GET_MODIFICATION_INFO),
    panicModeLog(PROCESS_GET_MODIFICATION_INFO),
    getKeyInvalidLog(getNull(), PROCESS_ACTIVE_MODIFICATION),
    getKeyNotExistLog(notExitKey, PROCESS_ACTIVE_MODIFICATION),
    panicModeLog(PROCESS_ACTIVE_MODIFICATION),
    trackingManagerCheck(PROCESS_ACTIVE_MODIFICATION),
    trackingManagerCheck(PROCESS_SEND_HIT),
    panicModeLog(PROCESS_SEND_HIT),
    hitIsReadyLog,
  ]);
});
