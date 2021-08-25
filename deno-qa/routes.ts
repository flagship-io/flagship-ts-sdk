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
  getVisitor,
  putVisitor,
  putVisitorValidation,
  updateConsent,
  updateConsentValidation,
} from "./controllers/visitor.ts";
import { Router } from "./deps.ts";

const router = new Router();

router
  .get("/env", getEnv)
  .put("/env", putEnvValidation, putEnv)
  .get("/visitor", getVisitor)
  .put("/visitor", putVisitorValidation, putVisitor)
  .put("/visitor/context/:contextKey", updateConsentValidation, updateConsent)
  .get("/flag/:flagKey", getFlagValidation, getFlag)
  .get("/flag/:flagKey/info", getFlagInfo)
  .get("/flag/:flagKey/activate", sendActivate)
  .post("/hit", sendHit)
  .get("/logs", getLog)
  .get("/clear", clearLog);

export default router;
