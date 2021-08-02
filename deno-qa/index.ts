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

const statusChangedCallback = (status: FlagshipStatus) => {
  console.log("status", FlagshipStatus[status]);
};

const app = new Application();
let env = "c0n48jn5thv01k0ijmo0"; // c0n48jn5thv01k0ijmo0
let apiKey = "BsIK86oh7c12c9G7ce4Wm1yBlWeaMf3t1S0xyYzI"; // BsIK86oh7c12c9G7ce4Wm1yBlWeaMf3t1S0xyYzI
let visitor_idVar: string;
let contextVar: Record<string, string | number | boolean> | undefined;
const router = new Router();
router
  .get("/env", async (context) => {
    Flagship.start(env, apiKey, {
      decisionMode: DecisionMode.DECISION_API,
      statusChangedCallback,
      logLevel: LogLevel.ERROR,
      fetchNow: false,
    });
    return (context.response.body = { env, apiKey });
  })
  .put("/env", async (context) => {
    const { environment_id, api_key, timeout } = await context.request.body()
      .value;
    Flagship.start(environment_id, api_key, {
      decisionMode: DecisionMode.DECISION_API,
      statusChangedCallback,
      logLevel: LogLevel.ERROR,
      fetchNow: false,
    });
    return (context.response.body = { environment_id, api_key, timeout });
  })
  .put("/visitor", async ({ request, response }) => {
    const { visitor_id, context } = await request.body().value;
    visitor_idVar = visitor_id;
    contextVar = context;
    const visitor = Flagship.newVisitor(`${visitor_id}`, context);
    if (visitor) {
      await visitor.synchronizeModifications();
      response.body = {
        modification: await visitor.getAllModifications(),
        context,
      };
    }
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
      await visitor.synchronizeModifications();
      visitor.updateContext(obj);
      //console.log(visitor);
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
    const visitor = Flagship.newVisitor(`${visitor_idVar}`, contextVar);
    if (visitor) {
      await visitor.synchronizeModifications();
      const modification = await visitor.getModification({
        key: flagKey,
        defaultValue: JSON.parse(defaultValue),
      });
      ctx.response.body = { value: modification };
      //console.log(visitor);
    }
  })
  .get("/flag/:flagKey/activate", async (ctx) => {
    const visitor = ctx.state.visitor;
    const { flagKey } = await ctx.params;

    await visitor.synchronizeModifications();
    if (visitor.activateModification(flagKey)) {
      return (ctx.response.body = "Activation sent");
    }
    return (ctx.response.body = "Not Sent");
    //console.log(key);
  })
  .get("/flag/:flagKey/info", async (ctx) => {
    const visitor = ctx.state.visitor;
    const { flagKey } = await ctx.params;

    await visitor.synchronizeModifications();
    const data = await visitor.getModificationInfo(flagKey);
    ctx.response.body = { data };
    //console.log(visitor);
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
      }
      case "PAGE": {
        visitor.sendHit({
          type: HitType.PAGE,
          documentLocation: hit.dl,
        });
      }
      case "TRANSACTION": {
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
    }
  });
app.use(async (ctx, next) => {
  if (Flagship.getStatus() === FlagshipStatus.READY) {
    const visitor = Flagship.newVisitor(`${visitor_idVar}`, contextVar);
    if (!visitor) {
      ctx.response.status = 400;
      ctx.response.body = "Visitor coudn't be created";
      return;
    }
    ctx.state.visitor = visitor;
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
