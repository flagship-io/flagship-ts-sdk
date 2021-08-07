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

let Infos = "";
let Errors = "";
let allInfo = "";

class CustomLogAdapter implements IFlagshipLogManager {
  emergency(message: string, tag: string): void {
    throw new Error("Method not implemented.");
  }

  alert(message: string, tag: string): void {
    throw new Error("Method not implemented.");
  }

  critical(message: string, tag: string): void {
    throw new Error("Method not implemented.");
  }

  error(message: string, tag: string): void {
    Infos += message;
  }

  warning(message: string, tag: string): void {
    throw new Error("Method not implemented.");
  }

  notice(message: string, tag: string): void {
    throw new Error("Method not implemented.");
  }

  info(message: string, tag: string): void {
    Infos += message;
  }

  debug(message: string, tag: string): void {
    this.log(LogLevel.DEBUG, message, tag);
  }

  log(level: any, message: string, tag: string): void {
    allInfo += message;
  }
}

const app = new Application();
const session = new OakSession(app);

const router = new Router();
router
  .get("/env", async (context) => {
    let environment_id = ""; // c0n48jn5thv01k0ijmo0
    let api_key = ""; // BsIK86oh7c12c9G7ce4Wm1yBlWeaMf3t1S0xyYzI
    let timeout = 0;
    let bucketing = false;
    let polling_interval = 0;

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
        polling_interval,
      });
    }
    return (context.response.body = {
      environment_id,
      api_key,
      timeout,
      bucketing,
      polling_interval,
    });
  })
  .put("/env", async (context) => {
    const { environment_id, api_key, timeout } = await context.request.body()
      .value;

    await context.state.session.set("envId", environment_id);
    await context.state.session.set("apiKey", api_key);
    await context.state.session.set("timeout", timeout);

    Flagship.start(environment_id, api_key, {
      decisionMode: DecisionMode.DECISION_API,
      statusChangedCallback,
      logLevel: LogLevel.ALL,
      fetchNow: false,
      logManager: new CustomLogAdapter(),
    });

    await context.state.session.set("logs", Infos);

    return (context.response.body = { environment_id, api_key, timeout });
  })
  .put("/visitor", async ({ request, response, state }) => {
    const { visitor_id, context } = await request.body().value;
    const visitor = Flagship.newVisitor(`${visitor_id}`, context);
    if (visitor) {
      await visitor.synchronizeModifications();
      response.body = {
        modification: await visitor.getAllModifications(),
        context,
      };
      await state.session.set("visitor_id", visitor_id);
      await state.session.set("context", context);
      await state.session.set("visitor", visitor);
      await state.session.set("logs", Infos);
    }
  })
  .get("/visitor", async ({ state, response }) => {
    let visitor_id: string = "";
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
      visitor_id,
      contextVar,
    });
  })
  .put(
    "/visitor/context/:flagKey",
    async ({ request, response, params, state }) => {
      let obj: Record<string, string | number | boolean> = {};
      const { type, value } = await request.body().value;
      const { flagKey } = await params;
      if (typeof flagKey === "undefined") {
        return (response.body = "ERROR MON GARS");
      }
      if (type === "bool") {
        obj[flagKey] = value === "true";
      } else if (
        type === "int" ||
        type === "float" ||
        type === "double" ||
        type === "long"
      ) {
        obj[flagKey] = Number(value);
      } else {
        obj[flagKey] = value;
      }

      const visitor = state.visitor;
      await state.session.set("visitor", visitor);
      await visitor.synchronizeModifications();
      visitor.updateContext(obj);
      await state.session.set("logs", Infos);
      response.body = {
        flags: await visitor.getAllModifications(),
        context: visitor.context,
      };
    }
  )
  .get("/flag/:flagKey", async (ctx) => {
    const { flagKey, type, activate, defaultValue } = helpers.getQuery(ctx, {
      mergeParams: true,
    });
    const visitor = ctx.state.visitor;
    if (visitor) {
      let defaultValueParse = defaultValue;
      try {
        defaultValueParse = JSON.parse(defaultValue);
      } catch {}
      await visitor.synchronizeModifications();
      const modification = await visitor.getModification({
        key: flagKey,
        defaultValue: defaultValueParse,
      });
      await ctx.state.session.set("logs", Infos);
      ctx.response.body = { value: modification };
    }
  })
  .get("/flag/:flagKey/activate", async (ctx) => {
    const visitor = ctx.state.visitor;
    const { flagKey } = await ctx.params;

    await visitor.synchronizeModifications();
    if (visitor.activateModification(flagKey)) {
      await ctx.state.session.set("logs", Infos);
      return (ctx.response.body = "Activation sent new version mon gars");
    }
    await ctx.state.session.set("logs", Infos);
    return (ctx.response.body = "Not Sent new version tu crois quoi?");
  })
  .get("/flag/:flagKey/info", async (ctx) => {
    const visitor = ctx.state.visitor;
    const { flagKey } = await ctx.params;

    await visitor.synchronizeModifications();
    const data = await visitor.getModificationInfo(flagKey);
    await ctx.state.session.set("logs", Infos);
    ctx.response.body = { data };
  })
  .post("/hit", async ({ request, response, state }) => {
    const visitor = state.visitor;
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
  });

app.use(async (ctx, next) => {
  let visitor_id: string = "";
  let contextVar: Record<string, string | number | boolean> | undefined;
  if (Flagship.getStatus() === FlagshipStatus.READY) {
    const visitor = (await ctx.state.session.has("visitor"))
      ? await ctx.state.session.get("visitor")
      : Flagship.newVisitor(`${visitor_id}`, contextVar);
    if (!visitor) {
      ctx.response.status = 400;
      ctx.response.body = "Visitor coudn't be created";
      return;
    }
    await ctx.state.session.set("visitor", visitor);
  }

  await next();
});

app.use(async (ctx, next) => {
  let envId: string = "";
  let apiKey: string = "";

  if (
    (await ctx.state.session.has("envId")) &&
    (await ctx.state.session.has("apiKey"))
  ) {
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
app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
  await send(context, context.request.url.pathname, {
    root: `${Deno.cwd()}/static`,
    index: "index.html",
  });
});
await app.listen({ port: 8000 });
