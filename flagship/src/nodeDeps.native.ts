export const globalOption:Record<string, unknown> = {}

export const fetch = (input: RequestInfo | URL, init?: RequestInit) => global.fetch(input, init)

export { EventEmitter } from 'events'
