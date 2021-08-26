import { RouterContext, RouteParams } from "../deps.ts";

export const getLog = async (
  // deno-lint-ignore no-explicit-any
  context: RouterContext<RouteParams, Record<string, any>>
) => {
  context.response.body = await context.state.session.get("logs");
};

export const clearLog = async (
  // deno-lint-ignore no-explicit-any
  context: RouterContext<RouteParams, Record<string, any>>
) => {
  await context.state.session.set("logs", null);
  return (context.response.body = null);
};
