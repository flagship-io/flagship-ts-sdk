// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const myFetch = (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)
export { EventEmitter } from 'events'
export const LocalAbortController = AbortController
