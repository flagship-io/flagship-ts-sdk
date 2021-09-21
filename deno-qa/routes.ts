import { getEnv, putEnv, putEnvValidation } from "./controllers/env.ts";
import {
  getFlag,
  getFlagInfo,
  getFlagValidation,
  sendActivate,
} from "./controllers/flag.ts";
import { sendHit } from "./controllers/hit.ts";
import { clearLog, getLog } from "./controllers/logs.ts";
import {
authenticate,
  getVisitor,
  putVisitor,
  putVisitorValidation,
  unauthenticate,
  updateConsent,
  updateConsentValidation,
} from "./controllers/visitor.ts";
import { RouteParams, Router, RouterContext } from "./deps.ts";

const router = new Router();

// deno-lint-ignore no-explicit-any
const checkFlagshipStart =async ({ response, state }: RouterContext<RouteParams, Record<string, any>>,
  next: () => Promise<unknown>)=>{
  if (!await state.session.has("config")) {
    response.status = 422
    return (response.body = {error: "First, set your Flagship Environment ID & API Key", ok:true})
  }
  await next()
}

// deno-lint-ignore no-explicit-any
const checkFsVisitor =async ({ response, state }: RouterContext<RouteParams, Record<string, any>>,
  next: () => Promise<unknown>)=>{
  if (!await state.session.has("visitor")) {
    response.status = 422
    return (response.body = {error: "Set your Visitor ID and context", ok:true})
  }
  await next()
}
router
  .get("/env", getEnv)
  .put("/env", putEnvValidation, putEnv)
  .get("/visitor", getVisitor)
  .put("/visitor",checkFlagshipStart, putVisitorValidation, putVisitor)
  .put("/visitor/context/:contextKey",checkFlagshipStart,checkFsVisitor, updateConsentValidation, updateConsent)
  
  .put("/authenticate",checkFlagshipStart,checkFsVisitor, authenticate)
  .put("/unauthenticate",checkFlagshipStart,checkFsVisitor, unauthenticate)

  .get("/flag/:flagKey",checkFlagshipStart,checkFsVisitor, getFlagValidation, getFlag)
  .get("/flag/:flagKey/info",checkFlagshipStart,checkFsVisitor, getFlagInfo)
  .get("/flag/:flagKey/activate",checkFlagshipStart,checkFsVisitor, sendActivate)
  .post("/hit",checkFlagshipStart,checkFsVisitor, sendHit)
  .get("/logs", getLog)
  .get("/clear", clearLog);

export default router;
