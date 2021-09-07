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
    res.json({ error, ok: true }).status(422)
  }

  res.locals.bodyValue = {
    visitorId,
    consent,
    context
  }

  next()
}

export const putVisitor = async (req: Request, res: Response):Promise<void> => {
  try {
    const { visitorId, context, consent } = res.locals.bodyValue

    const visitor = Flagship.newVisitor(`${visitorId}`, context)

    const responseBody: Record<string, unknown> = {
      modification: [],
      context: {},
      visitor_id: '',
      consent: false
    }

    if (visitor) {
      visitor.setConsent(!!consent)
      visitor.on('ready', (error: unknown) => {
        if (error) {
          console.log('error ready', error)
          return
        }
        console.log('ready')
      })

      await visitor.synchronizeModifications()

      req.session.visitor = visitor

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
    res.json({ error }).status(500)
  }
}

export const getVisitor = (req: Request, res: Response):void => {
  const visitorBody: Record<string, unknown> = {
    context: {}
  }
  if (req.session.visitor) {
    const visitor: Visitor = req.session.visitor
    visitorBody.visitor_id = visitor.visitorId
    visitorBody.context = visitor.context
    visitorBody.consent = visitor.hasConsented
  }
  res.json(visitorBody)
}

export const updateConsentValidation = async (req: Request, res: Response) => {
  const { type, value } = req.body.value
  const { contextKey } = params

  const error: Record<string, unknown> = {}

  const typeErrorMessage = (value: unknown, type: string) =>
    `value ${value} must be ${type}`

  if (!contextKey) {
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
        if (!new RegExp(/^(\d+[\.,]{1}\d+)|(\d+)$/, 'g').test(value)) {
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
  if (Object.keys(error).length) {
    response.status = 422
    return (response.body = { error, ok: true })
  }

  state.bodyValue = {
    [contextKey as string]: type === 'string' ? `${value}` : JSON.parse(value)
  }

  await next()
}

export const updateConsent = async ({
  response,
  state
// deno-lint-ignore no-explicit-any
}: RouterContext<RouteParams, Record<string, any>>) => {
  const context: Record<string, string | number | boolean> = state.bodyValue
  const responseBody: Record<string, unknown> = {}
  const visitor: Visitor = await state.session.get('visitor')
  if (visitor) {
    visitor.updateContext(context)
    responseBody.context = visitor.context
  }
  return (response.body = responseBody)
}

export const authenticate = async ({
  request,
  response,
  state
// deno-lint-ignore no-explicit-any
}: RouterContext<RouteParams, Record<string, any>>) => {
  // deno-lint-ignore camelcase
  const { new_visitor_id } = await request.body().value
  if (!new_visitor_id) {
    return (response.body = { error: 'new visitor ID is required', ok: true })
  }
  const responseBody: Record<string, unknown> = {}
  const visitor: Visitor = await state.session.get('visitor')
  if (visitor) {
    visitor.authenticate(new_visitor_id)
    responseBody.visitorId = visitor.visitorId
    responseBody.anonymousId = visitor.anonymousId
  }
  return (response.body = responseBody)
}

export const unauthenticate = async ({
  response,
  state
// deno-lint-ignore no-explicit-any
}: RouterContext<RouteParams, Record<string, any>>) => {
  const responseBody: Record<string, unknown> = {}
  const visitor: Visitor = await state.session.get('visitor')
  if (visitor) {
    visitor.unauthenticate()
    responseBody.visitorId = visitor.visitorId
    responseBody.anonymousId = visitor.anonymousId
  }
  return (response.body = responseBody)
}
