import { Request, Response, NextFunction, Visitor } from '../deps'
import { sessionVisitors } from './visitor'

function checkContextKey (key:string, defaultValue:unknown, type:string):Record<string, unknown> {
  const error: Record<string, unknown> = {}

  console.log(typeof defaultValue)

  const typeErrorMessage = (argValue: unknown, argType: string) =>
    `value ${argValue} must be ${argType}`

  switch (type) {
    case 'bool':
      if (typeof defaultValue !== 'boolean') {
        error.defaultValue = typeErrorMessage(defaultValue, type)
      }
      break
    case 'int':
    case 'float':
    case 'double':
    case 'long':
      if (!/^\d+(([.,]{0,1}\d+)|\d*)$/.test(`${defaultValue}`)) {
        error.defaultValue = typeErrorMessage(defaultValue, type)
      }
      break
    case 'JSONObject':
      if (
        typeof defaultValue !== 'object' ||
        Array.isArray(defaultValue)
      ) {
        error.defaultValue = typeErrorMessage(defaultValue, type)
      }
      break
    case 'JSONArray':
      if (
        typeof defaultValue !== 'object' ||
        !Array.isArray(defaultValue)
      ) {
        error.defaultValue = typeErrorMessage(defaultValue, type)
      }
      break
    default:
      break
  }
  return error
}

function parseType (defaultValue:unknown) {
  let parseDefaultValue = defaultValue
  try {
    parseDefaultValue = defaultValue ? JSON.parse(defaultValue as string) : ''
  } catch (err) {
    console.log(err)
  }
  return parseDefaultValue
}

export const getFlagValidation = (req: Request, res: Response, next: NextFunction):void => {
  const { flagKey } = req.params
  const { type, activate, defaultValue } = req.query

  const parseDefaultValue = parseType(defaultValue)

  const error = checkContextKey(flagKey, parseDefaultValue, type as string)

  if (Object.keys(error).length) {
    res.status(422).json({ error, ok: true })
    return
  }

  res.locals.flagValue = {
    flagKey,
    defaultValue: parseDefaultValue,
    activate: JSON.parse(activate as string)
  }
  next()
}

export const getFlag = async (req: Request, res: Response):Promise<void> => {
  try {
    const { flagKey, activate, defaultValue } = res.locals.flagValue
    const visitor = sessionVisitors[req.session.id]
    const response = {
      value: {}
    }
    if (visitor) {
      const flag = visitor.getFlag(flagKey, defaultValue)
      response.value = flag.getValue(activate)
    }
    res.json(response)
  } catch (error) {
    console.log('error', error)
    res.status(500).json(error)
  }
}

export const getFlagInfo = (req: Request, res: Response): void => {
  const visitor: Visitor = sessionVisitors[req.session.id]
  const { flagKey } = req.params
  const { defaultValue } = req.query
  const parseDefaultValue = parseType(defaultValue)
  const flag = visitor.getFlag(flagKey, parseDefaultValue)
  res.json(flag.metadata)
}

export const sendActivate = async (req: Request, res: Response):Promise<void> => {
  const visitor: Visitor = sessionVisitors[req.session.id]
  const { flagKey } = req.params
  const { defaultValue } = req.query
  const parseDefaultValue = parseType(defaultValue)
  const flag = visitor.getFlag(flagKey, parseDefaultValue)
  await flag.userExposed()
  res.json('successful operation')
}
