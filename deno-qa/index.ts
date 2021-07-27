import { Application, send, Router } from "https://deno.land/x/oak/mod.ts";
import {
  DecisionApiConfig,
  Flagship,
  FlagshipStatus,
  LogLevel,
} from "../flagship/dist-deno/src/mod.ts";

const config = new DecisionApiConfig();
config.logLevel = LogLevel.ERROR;
config.setStatusChangedCallback((status) => {
  console.log("status", FlagshipStatus[status]);
});
const app = new Application();
let env;
let apiKey;
const router = new Router();
router
  .put("/env", async (context) => {
    const { environment_id, api_key, timeout } = await context.request.body()
      .value;
    Flagship.start(environment_id, api_key, config);
    return (context.response.body = { environment_id, api_key, timeout });
  })
  .put("/visitor", async ({ request, response }) => {
    const { visitor_id, context } = await request.body().value;
    const visitor = Flagship.newVisitor(`${visitor_id}`, context);
    (async () => {
      if (visitor) {
        await visitor.synchronizeModifications();
        console.log(visitor.getModification("IsVIP", false));
        return (response.body = { visitor });
      }
    })();
    return response.body;
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
