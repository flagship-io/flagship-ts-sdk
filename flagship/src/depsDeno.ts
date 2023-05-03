
import Events from 'https://deno.land/x/events/mod.ts'

export const EventEmitter = Events

export const myFetch = (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)

export const LocalAbortController = AbortController
