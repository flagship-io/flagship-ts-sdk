
import { RouterContext, RouteParams, helpers, Visitor } from "../deps.ts";

export const getFlagValidation = async (
  // deno-lint-ignore no-explicit-any
  context: RouterContext<RouteParams, Record<string, any>>,
  next: () => Promise<unknown>
) => {
  const { flagKey, type, activate, defaultValue } = helpers.getQuery(context, {
    mergeParams: true,
  });
  const error: Record<string, unknown> = {};

  const typeErrorMessage = (value: unknown, type: string) =>
    `value ${value} must be ${type}`;

  let parseDefaultValue = defaultValue
  try {
     parseDefaultValue =defaultValue ? JSON.parse(defaultValue):"";
  } catch (_error) {
    //
  }
  
  switch (type) {
    case "bool":
      if (defaultValue !== "true" && defaultValue !== "false") {
        error.defaultValue = typeErrorMessage(defaultValue, type);
      }
      break;
    case "int":
    case "float":
    case "double":
    case "long":
      if (!new RegExp(/^(\d+[\.,]{1}\d+)|(\d+)$/, "g").test(defaultValue)) {
        error.defaultValue = typeErrorMessage(defaultValue, type);
      }
      break;
    case "JSONObject":
      if (
        typeof parseDefaultValue !== "object" ||
        Array.isArray(parseDefaultValue)
      ) {
        error.defaultValue = typeErrorMessage(defaultValue, type);
      }
      break;
    case "JSONArray":
      if (
        typeof parseDefaultValue !== "object" ||
        !Array.isArray(parseDefaultValue)
      ) {
        error.defaultValue = typeErrorMessage(defaultValue, type);
      }
      break;
    default:
      break;
  }
  if (Object.keys(error).length) {
    context.response.status = 422;
    return (context.response.body = { error, ok: true });
  }
  context.state.paramsValue = {
    flagKey,
    defaultValue: type === "string" ? defaultValue : parseDefaultValue,
    activate,
  };
  await next();
};

export const getFlag = async (
  // deno-lint-ignore no-explicit-any
  context: RouterContext<RouteParams, Record<string, any>>
) => {
  try {
    const { flagKey, activate, defaultValue } = context.state.paramsValue;
    const visitor: Visitor = await context.state.session.get("visitor");

    if (visitor) {
      const flag = visitor.getFlag(flagKey, defaultValue)
      const value = flag.getValue(activate)
      context.response.body = { value };
    }
  } catch (error) {
    console.log("error", error);
  }
};

function parseType (defaultValue:unknown) {
  let parseDefaultValue = defaultValue
  try {
    parseDefaultValue = defaultValue ? JSON.parse(defaultValue as string) : ''
  } catch (err) {
    console.log(err)
  }
  return parseDefaultValue
}

export const getFlagInfo = async (
  // deno-lint-ignore no-explicit-any
  context: RouterContext<RouteParams, Record<string, any>>
) => {
  const visitor: Visitor = await context.state.session.get("visitor");
  const { flagKey, defaultValue } =helpers.getQuery(context, {
    mergeParams: true,
  });

  const parseDefaultValue = parseType(defaultValue)
  const flag = visitor.getFlag(flagKey, parseDefaultValue)

  return (context.response.body = flag.metadata);
};

export const sendActivate = async (
  // deno-lint-ignore no-explicit-any
  context: RouterContext<RouteParams, Record<string, any>>
) => {
  const visitor: Visitor = await context.state.session.get("visitor");
  const { flagKey, defaultValue } =helpers.getQuery(context, {
    mergeParams: true,
  });

  const parseDefaultValue = parseType(defaultValue)
  const flag = visitor.getFlag(flagKey, parseDefaultValue)
  await flag.userExposed()
  
  return (context.response.body = "successful operation");
};
