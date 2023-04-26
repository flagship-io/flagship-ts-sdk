
import Events from 'https://deno.land/x/events/mod.ts'

export const EventEmitter = Events

export const fetch = (input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init)

export const AbortController = globalThis.AbortController
export const AbortSignal = globalThis.AbortSignal
