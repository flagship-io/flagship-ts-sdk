import { Flagship, Request, Response, NextFunction, Visitor, Modification } from '../deps'

export const putVisitorValidation = (req: Request, res: Response, next: NextFunction):void => {
  const {
    visitor_id: visitorId,
    context,
    consent
  } = req.body

  const error: Record<string, unknown> = {}
  const messageRequired = (field: string) => {
    return `Field ${field} is required`
  }

  if (!visitorId) {
    error.visitorId = messageRequired('Visitor Id')
  }

  if (Object.keys(error).length) {
    res.status(422).json({ error, ok: true })
    return
  }

  res.locals.bodyValue = {
    visitorId,
    consent,
    context
  }

  next()
}

export const sessionVisitors:Record<string, Visitor> = {}
export const putVisitor = async (req: Request, res: Response):Promise<void> => {
  try {
    const { visitorId, context, consent } = res.locals.bodyValue

    const visitor = Flagship.newVisitor({ visitorId: `${visitorId}`, context, hasConsented: consent })

    const responseBody: Record<string, unknown> = {
      modification: [],
      context: {},
      visitor_id: '',
      consent: false
    }

    if (visitor) {
      visitor.on('ready', (error: unknown) => {
        if (error) {
          console.log('error ready', error)
          return
        }
        console.log('ready')
      })

      await visitor.synchronizeModifications()

      sessionVisitors[req.session.id] = visitor

      const modifications: Modification[] = []
      visitor.modifications.forEach((value) => {
        modifications.push(value)
      })

      responseBody.modification = modifications
      responseBody.context = visitor.context
      responseBody.visitor_id = visitor.visitorId
      responseBody.consent = visitor.hasConsented
    }
    res.json(responseBody)
  } catch (error) {
    res.status(500).json({ error })
  }
}

export const getVisitor = (req: Request, res: Response):void => {
  const visitorBody: Record<string, unknown> = {
    context: {}
  }
  const visitor: Visitor = sessionVisitors[req.session.id]
  if (visitor) {
    visitorBody.visitor_id = visitor.visitorId
    visitorBody.context = visitor.context
    visitorBody.consent = visitor.hasConsented
  }
  res.json(visitorBody)
}

function checkContextKey (key:string, value:string, type:string):Record<string, unknown> {
  const error: Record<string, unknown> = {}
  const typeErrorMessage = (argValue: unknown, argType: string) =>
    `value ${argValue} must be ${argType}`

  if (!key) {
    error.contextKey = 'context key is required'
  } else {
    switch (type) {
      case 'bool':
        if (value !== 'true' && value !== 'false') {
          error.value = typeErrorMessage(value, type)
        }
        break
      case 'int':
      case 'float':
      case 'double':
      case 'long':
        if (!/^\d+(([.,]{0,1}\d+)|\d*)$/.test(value)) {
          error.value = typeErrorMessage(value, type)
        }
        break
      default:
        if (typeof value !== 'string') {
          error.value = typeErrorMessage(value, type)
        }
        break
    }
  }
  return error
}

export const updateConsentValidation = (req: Request, res: Response, next: NextFunction):void => {
  const { type, value } = req.body
  const { contextKey } = req.params

  const error = checkContextKey(contextKey, value, type)

  if (Object.keys(error).length) {
    res.json({ error, ok: true }).status(422)
    return
  }

  res.locals.bodyValue = {
    [contextKey]: type === 'string' ? `${value}` : JSON.parse(value)
  }
  next()
}

export const updateConsent = (req: Request, res: Response):void => {
  const context: Record<string, string | number | boolean> = res.locals.bodyValue
  const responseBody: Record<string, unknown> = {}
  const visitor = sessionVisitors[req.session.id]
  if (visitor) {
    visitor.updateContext(context)
    responseBody.context = visitor.context
  }
  res.json(responseBody)
}

export const authenticate = (req: Request, res: Response):void => {
  // eslint-disable-next-line camelcase
  const { new_visitor_id } = req.body

  // eslint-disable-next-line camelcase
  if (!new_visitor_id) {
    res.json({ error: 'new visitor ID is required', ok: true })
    return
  }

  const responseBody: Record<string, unknown> = {}
  const visitor = sessionVisitors[req.session.id]
  if (visitor) {
    visitor.authenticate(new_visitor_id)
    responseBody.visitorId = visitor.visitorId
    responseBody.anonymousId = visitor.anonymousId
  }
  res.json(responseBody)
}

export const unauthenticate = (req: Request, res: Response):void => {
  const responseBody: Record<string, unknown> = {}
  const visitor = sessionVisitors[req.session.id]
  if (visitor) {
    visitor.unauthenticate()
    responseBody.visitorId = visitor.visitorId
    responseBody.anonymousId = visitor.anonymousId
  }
  res.json(responseBody)
}
