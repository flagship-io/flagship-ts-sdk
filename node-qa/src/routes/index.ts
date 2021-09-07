import express from 'express'
import { putEnv, putEnvValidation, getEnv } from '../controllers/env'
import path from 'path'
const router = express.Router()

router.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'))
})
router.put('/env', putEnvValidation, putEnv)
router.get('/env', getEnv)

export = router;
