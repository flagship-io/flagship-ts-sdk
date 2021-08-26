import { Modification } from "../../flagship/dist-deno/src/mod.ts";
import { Flagship, RouteParams, RouterContext, Visitor } from "../deps.ts";

export const putVisitorValidation = async (
  // deno-lint-ignore no-explicit-any
  { request, response, state }: RouterContext<RouteParams, Record<string, any>>,
  next: () => Promise<unknown>
) => {
  const {
    visitor_id: visitorId,
    context,
    consent,
  } = await request.body().value;

  const error: Record<string, unknown> = {};
  const messageRequired = (field: string) => {
    return `Field ${field} is required`;
  };

  if (!visitorId) {
    error.visitorId = messageRequired("Visitor Id");
  }

  if (Object.keys(error).length) {
    response.status = 422;
    return (response.body = { error, ok: true });
  }

  state.bodyValue = {
    visitorId,
    consent,
    context,
  };

  await next();
};

export const putVisitor = async ({
  response,
  state,
// deno-lint-ignore no-explicit-any
}: RouterContext<RouteParams, Record<string, any>>) => {
  try {
    const { visitorId, context,consent } = state.bodyValue;
    const visitor = Flagship.newVisitor(`${visitorId}`, context );
    const responseBody: Record<string, unknown> = {
      modification: [],
      context: {},
      // deno-lint-ignore camelcase
      visitor_id: "",
      consent: false,
    };
    if (visitor) {
      visitor.setConsent(!!consent);
      visitor.on("ready", (error: any) => {
        if (error) {
          console.log("error ready", error);
          return;
        }
        console.log("ready");
      });
      await visitor.synchronizeModifications();
      await state.session.set("visitor", visitor);
      const modifications: Modification[] = [];
      visitor.modifications.forEach((value) => {
        modifications.push(value);
      });
      responseBody.modification = modifications;
      responseBody.context = visitor.context;
      responseBody.visitor_id = visitor.visitorId;
      responseBody.consent = visitor.hasConsented;
    }
    return (response.body = responseBody);
  } catch (error) {
    console.log(error);
    response.status = 500;
    return (response.body = { error });
  }
};

export const getVisitor = async ({
  state,
  response,
// deno-lint-ignore no-explicit-any
}: RouterContext<RouteParams, Record<string, any>>) => {
  const visitorBody: Record<string, unknown> = {
    context: {},
  };
  if (await state.session.has("visitor")) {
    const visitor: Visitor = await state.session.get("visitor");
    visitorBody.visitor_id = visitor.visitorId;
    visitorBody.context = visitor.context;
    visitorBody.consent = visitor.hasConsented;
  }
  return (response.body = visitorBody);
};

export const updateConsentValidation = async (
  {
    request,
    params,
    response,
    state,
  // deno-lint-ignore no-explicit-any
  }: RouterContext<RouteParams, Record<string, any>>,
  next: () => Promise<unknown>
) => {
  const { type, value } = await request.body().value;
  const { contextKey } = params;

  const error: Record<string, unknown> = {};

  const typeErrorMessage = (value: unknown, type: string) =>
    `value ${value} must be ${type}`;

  if (!contextKey) {
    error.contextKey = `context key is required`;
  } else {
    switch (type) {
      case "bool":
        if (value !== "true" && value !== "false") {
          error.value = typeErrorMessage(value, type);
        }
        break;
      case "int":
      case "float":
      case "double":
      case "long":
        if (!new RegExp(/^(\d+[\.,]{1}\d+)|(\d+)$/, "g").test(value)) {
          error.value = typeErrorMessage(value, type);
        }
        break;
      default:
        if (typeof value !== "string") {
          error.value = typeErrorMessage(value, type);
        }
        break;
    }
  }
  if (Object.keys(error).length) {
    response.status = 422;
    return (response.body = { error, ok: true });
  }

  state.bodyValue = {
    [contextKey as string]: type === "string" ? `${value}` : JSON.parse(value),
  };

  await next();
};

export const updateConsent = async ({
  response,
  state,
// deno-lint-ignore no-explicit-any
}: RouterContext<RouteParams, Record<string, any>>) => {
  const context: Record<string, string | number | boolean> = state.bodyValue;
  const responseBody: Record<string, unknown> = {};
  const visitor: Visitor = await state.session.get("visitor");
  if (visitor) {
    visitor.updateContext(context);
    responseBody.context = visitor.context;
  }
  return (response.body = responseBody);
};
