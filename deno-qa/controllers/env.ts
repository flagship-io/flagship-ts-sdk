import {
  Flagship,
  DecisionMode,
  LogLevel,
  FlagshipStatus,
  RouteParams,
  RouterContext,
} from "../deps.ts";
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
    bucketing,
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
  if (bucketing && typeof pollingInterval !== "number") {
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
  const config = {
    // deno-lint-ignore camelcase
    environment_id: null,
    // deno-lint-ignore camelcase
    api_key: null,
    timeout: 2000,
    bucketing: false,
    // deno-lint-ignore camelcase
    polling_interval: 2000,
  };

  if (await context.state.session.has("config")) {
    const configSession = await context.state.session.get("config");
    config.environment_id = configSession.environmentId;
    config.api_key = configSession.apiKey;
    config.timeout = configSession.timeout;
    config.bucketing = configSession.bucketing;
    config.polling_interval = configSession.pollingInterval;
  }
  return (context.response.body = config);
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

  await context.state.session.set("config", {
    environmentId,
    apiKey,
    timeout,
    bucketing,
    pollingInterval,
  });

  Flagship.start(environmentId, apiKey, {
    decisionMode: bucketing
      ? DecisionMode.BUCKETING
      : DecisionMode.DECISION_API,
    statusChangedCallback,
    logLevel: LogLevel.ALL,
    fetchNow: false,
    logManager: new CustomLogAdapter(context.state.session),
  });

  return (context.response.body = { environmentId, apiKey, timeout });
};
