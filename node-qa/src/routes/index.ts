import express from 'express'
import { putEnv, putEnvValidation, getEnv } from '../controllers/env'
import { getVisitor, putVisitorValidation, putVisitor, updateConsent, updateConsentValidation, authenticate, unauthenticate } from '../controllers/visitor'
import path from 'path'
import { checkFlagshipStart } from '../middlewares/checkFlagshipStart'
import { checkFsVisitor } from '../middlewares/checkFsVisitor'
import { getFlagValidation, getFlag, getFlagInfo, sendActivate } from '../controllers/flag'
import { sendHit } from '../controllers/hit'
import { getLog, clearLog } from '../controllers/logs'
const router = express.Router()

router.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'))
})
router.put('/env', putEnvValidation, putEnv)
router.get('/env', getEnv)

router.get('/visitor', getVisitor)
  .put('/visitor/context/:contextKey', checkFlagshipStart, checkFsVisitor, updateConsentValidation, updateConsent)
  .put('/visitor', checkFlagshipStart, putVisitorValidation, putVisitor)
  .put('/authenticate', checkFlagshipStart, checkFsVisitor, authenticate)
  .put('/unauthenticate', checkFlagshipStart, checkFsVisitor, unauthenticate)

router.get('/flag/:flagKey', checkFlagshipStart, checkFsVisitor, getFlagValidation, getFlag)
  .get('/flag/:flagKey/info', checkFlagshipStart, checkFsVisitor, getFlagInfo)
  .get('/flag/:flagKey/activate', checkFlagshipStart, checkFsVisitor, sendActivate)

router.post('/hit', checkFlagshipStart, checkFsVisitor, sendHit)

router.get('/logs', getLog)
  .get('/clear', clearLog)

export = router;
