
import {
  Flagship,
  DecisionMode,
  LogLevel,
  FlagshipStatus,
  Request,
  Response,
  NextFunction
} from '../deps'
import { CustomLogAdapter } from '../utils/logger'

export const putEnvValidation = (req: Request, res: Response, next: NextFunction):void => {
  const {
    environment_id: environmentId,
    api_key: apiKey,
    polling_interval: pollingInterval,
    timeout,
    bucketing
  } = req.body

  const error: Record<string, unknown> = {}

  const messageRequired = (field: string) => {
    return `Field ${field} is required`
  }
  const messageNumber = (field: string) => {
    return `Field ${field} is must be a number`
  }
  if (!environmentId) {
    error.environmentId = messageRequired('environmentId')
  }
  if (!apiKey) {
    error.apiKey = messageRequired('apiKey')
  }
  if (bucketing && typeof pollingInterval !== 'number') {
    error.pollingInterval = messageNumber('pollingInterval')
  }
  if (typeof timeout !== 'number') {
    error.timeout = messageNumber('pollingInterval')
  }
  if (Object.keys(error).length) {
    res.json({ error, ok: true }).status(422)
    return
  }
  next()
}

export const getEnv = (req: Request, res: Response):void => {
  const config = {
    // deno-lint-ignore camelcase
    environment_id: '',
    // deno-lint-ignore camelcase
    api_key: '',
    timeout: 2000,
    bucketing: false,
    // deno-lint-ignore camelcase
    polling_interval: 2000
  }

  if (req.session.config) {
    const configSession = req.session.config
    config.environment_id = configSession.environmentId
    config.api_key = configSession.apiKey
    config.timeout = configSession.timeout * 1000
    config.bucketing = configSession.bucketing
    config.polling_interval = configSession.pollingInterval
  }
  res.json(config)
}

const statusChangedCallback = (status: FlagshipStatus) => {
  console.log('status', FlagshipStatus[status])
}

export const putEnv = (req: Request, res: Response):void => {
  const {
    environment_id: environmentId,
    api_key: apiKey,
    polling_interval: pollingInterval,
    timeout,
    bucketing
  } = req.body

  req.session.config = {
    environmentId,
    apiKey,
    timeout: timeout / 1000,
    bucketing,
    pollingInterval
  }

  Flagship.start(environmentId, apiKey, {
    decisionMode: bucketing
      ? DecisionMode.BUCKETING
      : DecisionMode.DECISION_API,
    statusChangedCallback,
    logLevel: LogLevel.ALL,
    fetchNow: false,
    timeout: timeout / 1000,
    logManager: new CustomLogAdapter(req.session),
    pollingInterval
  })

  res.json({ environmentId, apiKey, timeout })
}
