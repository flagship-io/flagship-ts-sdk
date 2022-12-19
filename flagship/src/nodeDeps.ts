export const globalOption:Record<string, unknown> = {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const fetch = typeof window === 'undefined' ? require('node-fetch').default : window.fetch

if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Agent: HttpAgent } = require('http')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Agent: HttpAgents } = require('https')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalOption.agent = (parsedURL:URL) => {
    return parsedURL.protocol === 'http:' ? new HttpAgent({ keepAlive: true }) : new HttpAgents({ keepAlive: true })
  }
}

export { EventEmitter } from 'events'
