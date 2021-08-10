import {
  Application,
  send,
  Router,
  helpers,
} from "https://deno.land/x/oak/mod.ts";
import {
  DecisionMode,
  Flagship,
  FlagshipStatus,
  LogLevel,
  HitType,
  EventCategory,
} from "../flagship/dist-deno/src/mod.ts";
import { OakSession } from "https://deno.land/x/sessions/mod.ts";
import { IFlagshipLogManager } from "../flagship/dist-deno/src/utils/FlagshipLogManager.ts";

const statusChangedCallback = (status: FlagshipStatus) => {
  console.log("status", FlagshipStatus[status]);
};

let envIdGlobale: any;
let apiKeyGlobal: any;

let Infos = "";
let Errors = "";
let allInfo = "";

class CustomLogAdapter implements IFlagshipLogManager {
  emergency(_message: string, _tag: string): void {
    throw new Error("Method not implemented.");
  }

  alert(_message: string, _tag: string): void {
    throw new Error("Method not implemented.");
  }

  critical(_message: string, _tag: string): void {
    throw new Error("Method not implemented.");
  }

  error(message: string, _tag: string): void {
    Infos += message + "\n";
    Errors += message + "\n";
  }

  warning(_message: string, _tag: string): void {
    throw new Error("Method not implemented.");
  }

  notice(_message: string, _tag: string): void {
    throw new Error("Method not implemented.");
  }

  info(message: string, _tag: string): void {
    Infos += message + "\n";
  }

  debug(message: string, tag: string): void {
    Infos += message + "\n";
  }

  log(_level: any, message: string, _tag: string): void {
    Infos += message + "\n";
  }
}

const app = new Application();
const _session: OakSession = new OakSession(app);

const router = new Router();
router
  .get("/env", async (context) => {
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
  })
  .put("/env", async (context) => {
    const {
      environment_id: environmentId,
      api_key: apiKey,
      timeout,
    } = await context.request.body().value;

    await context.state.session.set("envId", environmentId);
    await context.state.session.set("apiKey", apiKey);
    await context.state.session.set("timeout", timeout);

    envIdGlobale = environmentId;
    apiKeyGlobal = apiKey;

    Flagship.start(environmentId, apiKey, {
      decisionMode: DecisionMode.DECISION_API,
      statusChangedCallback,
      logLevel: LogLevel.ALL,
      fetchNow: false,
      logManager: new CustomLogAdapter(),
    });

    await context.state.session.set("logs", Infos);

    return (context.response.body = { environmentId, apiKey, timeout });
  })
  .put("/visitor", async ({ request, response, state }) => {
    const { visitor_id: visitorId, context } = await request.body().value;
    const visitor = Flagship.newVisitor(`${visitorId}`, context);
    if (visitor) {
      await visitor.synchronizeModifications();
      await state.session.set("visitor_id", visitorId);
      await state.session.set("context", context);
      await state.session.set("visitor", visitor);
      await state.session.set("logs", Infos);
      response.body = {
        modification: await visitor.getAllModifications(),
        context,
      };
    }
  })
  .get("/visitor", async ({ state, response }) => {
    const visitorId = "";
    let contextVar: Record<string, string | number | boolean> | undefined;

    if (
      (await state.session.has("visitor")) &&
      (await state.session.has("context")) &&
      (await state.session.has("visitor_id"))
    ) {
      return (response.body = {
        visitor_id: await state.session.get("visitor_id"),
        context: await state.session.get("context"),
      });
    }
    return (response.body = {
      visitorId,
      contextVar,
    });
  })
  .put(
    "/visitor/context/:flagKey",
    async ({ request, response, params, state }) => {
      const obj: Record<string, string | number | boolean> = {};
      const { type, value } = await request.body().value;
      const { flagKey } = params;
      if (typeof flagKey === "undefined") {
        return (response.body = { error: "ERROR flag Key undefined" });
      }
      if (type === "bool") {
        obj[flagKey] = value === "true";
      } else if (
        type === "int" ||
        type === "float" ||
        type === "double" ||
        type === "long"
      ) {
        if (isNaN(Number(value))) {
          return (response.body = {
            error: "No Context updated due to Error in Type",
          });
        }
        obj[flagKey] = Number(value);
      } else {
        obj[flagKey] = value;
      }

      const visitor = await state.session.get("visitor");
      if (visitor) {
        await visitor.synchronizeModifications();
        visitor.updateContext(obj);
        await state.session.set("logs", Infos);
        response.body = {
          flags: await visitor.getAllModifications(),
          context: visitor.context,
        };
      }
    }
  )
  .get("/flag/:flagKey", async (ctx) => {
    const { flagKey, type, activate, defaultValue } = helpers.getQuery(ctx, {
      mergeParams: true,
    });
    const visitor = await ctx.state.session.get("visitor");
    if (visitor) {
      let defaultValueParse = defaultValue;
      try {
        if (typeof flagKey === "undefined") {
          return (ctx.response.body = { error: "ERROR flag Key undefined" });
        }
        if (type === "bool") {
          if (defaultValue !== "true" && defaultValue !== "false") {
            return (ctx.response.body = {
              error: "No Context updated due to Error in Type",
            });
          }
        } else if (
          type === "int" ||
          type === "float" ||
          type === "double" ||
          type === "long"
        ) {
          if (isNaN(Number(defaultValue))) {
            return (ctx.response.body = {
              error: "No Context updated due to Error in Type",
            });
          }
          Number(defaultValue);
        } else {
          defaultValue;
        }
        defaultValueParse =
          type === "bool" ? JSON.parse(defaultValue) : defaultValue;
      } catch {
        ctx.response.body = "Error in type";
      }
      await visitor.synchronizeModifications();
      const modification = await visitor.getModification({
        key: flagKey,
        defaultValue: defaultValueParse,
        activate,
      });
      await ctx.state.session.set("logs", Infos);
      ctx.response.body = { value: `${flagKey} : ${modification}` };
    }
  })
  .get("/flag/:flagKey/activate", async (ctx) => {
    const visitor = await ctx.state.session.get("visitor");
    const { flagKey } = await ctx.params;

    await visitor.synchronizeModifications();
    if (visitor.activateModification(flagKey)) {
      await ctx.state.session.set("logs", Infos);
      return (ctx.response.body = "Activation sent");
    }
    await ctx.state.session.set("logs", Infos);
    return (ctx.response.body = "Not Sent");
  })
  .get("/flag/:flagKey/info", async (ctx) => {
    const visitor = await ctx.state.session.get("visitor");
    const { flagKey } = await ctx.params;

    await visitor.synchronizeModifications();
    const data = await visitor.getModificationInfo(flagKey);
    await ctx.state.session.set("logs", Infos);
    ctx.response.body = { data };
  })
  .post("/hit", async ({ request, response, state }) => {
    const visitor = await state.session.get("visitor");
    const hit = await request.body().value;

    switch (hit.t) {
      case "EVENT": {
        visitor.sendHit({
          type: HitType.EVENT,
          category:
            hit.ec === "ACTION_TRACKING"
              ? EventCategory.ACTION_TRACKING
              : EventCategory.USER_ENGAGEMENT,
          action: hit.ea,
          eventLabel: hit.el,
          eventValue: hit.ev,
        });
        response.body = "Hit sent";
        break;
      }
      case "ITEM": {
        visitor.sendHit({
          type: HitType.ITEM,
          transactionId: hit.tid,
          productName: hit.in,
          productSku: hit.ic,
          itemPrice: hit.ip,
          itemQuantity: hit.iq,
          itemCategory: hit.iv,
        });
        response.body = "Hit sent";
        break;
      }
      case "SCREEN": {
        visitor.sendHit({
          type: HitType.SCREEN,
          documentLocation: hit.dl,
        });
        break;
      }
      case "PAGE": {
        visitor.sendHit({
          type: HitType.PAGE,
          documentLocation: hit.dl,
        });
        break;
      }
      case "TRANSACTION":
        {
          visitor.sendHit({
            type: HitType.TRANSACTION,
            transactionId: hit.tid,
            affiliation: hit.ta,
            taxes: hit.tt,
            currency: hit.tc,
            couponCode: hit.tcc,
            itemCount: hit.icn,
            shippingMethod: hit.sm,
            paymentMethod: hit.pm,
            totalRevenue: hit.tr,
            shippingCosts: hit.ts,
          });
        }
        break;
    }

    await state.session.set("logs", Infos);
  })
  .get("/logs", async (ctx) => {
    ctx.response.body = await ctx.state.session.get("logs");
  })
  .get("/clear", async (ctx) => {
    Infos = "";
    await ctx.state.session.set("logs", Infos);
    ctx.response.body = await ctx.state.session.get("logs");
  });

app.use(async (ctx, next) => {
  const envId = "";
  const apiKey = "";
  if (
    (await ctx.state.session.has("envId")) &&
    (await ctx.state.session.has("apiKey"))
  ) {
    if (
      envIdGlobale !== (await ctx.state.session.get("envId")) &&
      apiKeyGlobal !== (await ctx.state.session.get("apiKey"))
    ) {
      envIdGlobale = await ctx.state.session.get("envId");
      apiKeyGlobal = await ctx.state.session.get("apiKey");
      Flagship.start(
        await ctx.state.session.get("envId"),
        await ctx.state.session.get("apiKey"),
        {
          decisionMode: DecisionMode.DECISION_API,
          statusChangedCallback,
          logLevel: LogLevel.ALL,
          fetchNow: false,
          logManager: new CustomLogAdapter(),
        }
      );
    }
  } else {
    Flagship.start(envId, apiKey, {
      decisionMode: DecisionMode.DECISION_API,
      statusChangedCallback,
      logLevel: LogLevel.ALL,
      fetchNow: false,
      logManager: new CustomLogAdapter(),
    });
  }

  await next();
});

app.use(async (ctx, next) => {
  const visitorId = "";
  let contextVar: Record<string, string | number | boolean> | undefined;
  if (Flagship.getStatus() === FlagshipStatus.READY) {
    const visitor = (await ctx.state.session.has("visitor"))
      ? await ctx.state.session.get("visitor")
      : Flagship.newVisitor(`${visitorId}`, contextVar);
    if (!visitor) {
      ctx.response.status = 400;
      ctx.response.body = "Visitor coudn't be created";
      return;
    }
  }

  await next();
});

app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
  await send(context, context.request.url.pathname, {
    root: `${Deno.cwd()}/static`,
    index: "index.html",
  });
});
await app.listen({ port: 8000 });
