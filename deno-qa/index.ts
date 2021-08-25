import { Application, send, OakSession } from "./deps.ts";
import router from "./routes.ts";

const app = new Application();
const _session: OakSession = new OakSession(app);

// app.use(async (ctx, next) => {
//   const envId = "";
//   const apiKey = "";
//   if (
//     (await ctx.state.session.has("envId")) &&
//     (await ctx.state.session.has("apiKey"))
//   ) {
//     if (
//       envIdGlobale !== (await ctx.state.session.get("envId")) &&
//       apiKeyGlobal !== (await ctx.state.session.get("apiKey"))
//     ) {
//       envIdGlobale = await ctx.state.session.get("envId");
//       apiKeyGlobal = await ctx.state.session.get("apiKey");
//       Flagship.start(
//         await ctx.state.session.get("envId"),
//         await ctx.state.session.get("apiKey"),
//         {
//           decisionMode: DecisionMode.DECISION_API,
//           statusChangedCallback,
//           logLevel: LogLevel.ALL,
//           fetchNow: false,
//           logManager: new CustomLogAdapter(),
//         }
//       );
//     }
//   } else {
//     Flagship.start(envId, apiKey, {
//       decisionMode: DecisionMode.DECISION_API,
//       statusChangedCallback,
//       logLevel: LogLevel.ALL,
//       fetchNow: false,
//       logManager: new CustomLogAdapter(),
//     });
//   }

//   await next();
// });

// app.use(async (ctx, next) => {
//   const visitorId = "";
//   let contextVar: Record<string, string | number | boolean> | undefined;
//   if (Flagship.getStatus() === FlagshipStatus.READY) {
//     const visitor = (await ctx.state.session.has("visitor"))
//       ? await ctx.state.session.get("visitor")
//       : Flagship.newVisitor(`${visitorId}`, contextVar);
//     if (!visitor) {
//       ctx.response.status = 400;
//       ctx.response.body = "Visitor coudn't be created";
//       return;
//     }
//   }

//   await next();
// });

app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
  await send(context, context.request.url.pathname, {
    root: `${Deno.cwd()}/static`,
    index: "index.html",
  });
});
await app.listen({ port: 8000 });
