export const fetch = (input: RequestInfo | URL, init?: RequestInit) => global.fetch(input, init)

export { EventEmitter } from 'events'

export const AbortController = global.AbortController
export const AbortSignal = global.AbortSignal
