export const fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (globalThis) {
    return globalThis.fetch(input, init)
  }
  if (window) {
    return window.fetch(input, init)
  }
  if (self) {
    return self.fetch(input, init)
  }
}

export { EventEmitter } from 'events'
