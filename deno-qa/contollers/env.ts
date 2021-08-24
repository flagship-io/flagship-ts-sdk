import { Flagship,DecisionMode,LogLevel, FlagshipStatus, RouteParams, RouterContext } from "../deps.ts";
import { CustomLogAdapter } from "../utils/logger.ts";

export const putEnvValidation = async (
  // deno-lint-ignore no-explicit-any
  context: RouterContext<RouteParams, Record<string, any>>,
  next: () => Promise<unknown>
) => {
  const {
    environment_id: environmentId,
    api_key: apiKey,
    polling_interval: pollingInterval,
    timeout,
  } = await context.request.body().value;
  const error: Record<string, unknown> = {};
  const messageRequired = (field: string) => {
    return `Field ${field} is required`;
  };
  const messageNumber = (field: string) => {
    return `Field ${field} is must be a number`;
  };
  if (!environmentId) {
    error.environmentId = messageRequired("environmentId");
  }
  if (!apiKey) {
    error.apiKey = messageRequired("apiKey");
  }
  if (typeof pollingInterval !== "number") {
    error.pollingInterval = messageNumber("pollingInterval");
  }
  if (typeof timeout !== "number") {
    error.timeout = messageNumber("pollingInterval");
  }
  if (Object.keys(error).length) {
    context.response.status = 422;
    return (context.response.body = { error, ok: true });
  }
  await next();
};

export const getEnv = async (
  // deno-lint-ignore no-explicit-any
  context: RouterContext<RouteParams, Record<string, any>>
) => {
  const environmentId = ""; // c0n48jn5thv01k0ijmo0
  const apiKey = ""; // BsIK86oh7c12c9G7ce4Wm1yBlWeaMf3t1S0xyYzI
  const timeout = 0;
  const bucketing = false;
  const pollingInterval = 0;

  if (
    (await context.state.session.has("envId")) &&
    (await context.state.session.has("apiKey")) &&
    (await context.state.session.has("timeout"))
  ) {
    return (context.response.body = {
      environment_id: await context.state.session.get("envId"),
      api_key: await context.state.session.get("apiKey"),
      timeout: await context.state.session.get("timeout"),
      bucketing,
      pollingInterval,
    });
  }
  return (context.response.body = {
    environmentId,
    apiKey,
    timeout,
    bucketing,
    pollingInterval,
  });
};

const statusChangedCallback = (status: FlagshipStatus) => {
    console.log("status", FlagshipStatus[status]);
  };
  

export const putEnv = async (
  // deno-lint-ignore no-explicit-any
  context: RouterContext<RouteParams, Record<string, any>>
) => {
  const {
    environment_id: environmentId,
    api_key: apiKey,
    polling_interval: pollingInterval,
    timeout,
    bucketing,
  } = await context.request.body().value;

  await context.state.session.set("envId", environmentId);
  await context.state.session.set("apiKey", apiKey);
  await context.state.session.set("timeout", timeout);
  await context.state.session.set("bucketing", bucketing);
  await context.state.session.set("pollingInterval", pollingInterval);

//   envIdGlobale = environmentId;
//   apiKeyGlobal = apiKey;

  Flagship.start(environmentId, apiKey, {
    decisionMode: bucketing
      ? DecisionMode.BUCKETING
      : DecisionMode.DECISION_API,
    statusChangedCallback,
    logLevel: LogLevel.ALL,
    fetchNow: false,
    logManager: new CustomLogAdapter(),
    pollingInterval,
  });

  await context.state.session.set("logs", Infos);
  return (context.response.body = { environmentId, apiKey, timeout });
};
