
function getHttpAgent ():Record<string, unknown> {
  const globalOption:Record<string, unknown> = {}
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

  return globalOption
}

let myFetch:(input: URL | RequestInfo, init?: RequestInit)=> Promise<Response>

export const fetch = (input: URL | RequestInfo, init?: RequestInit): Promise<Response> => {
  let globalOption:Record<string, unknown> = {}
  if (!myFetch) {
    globalOption = getHttpAgent()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    myFetch = typeof window === 'undefined' ? require('node-fetch').default : window.fetch
  }

  return myFetch(input, {
    ...globalOption,
    ...init
  })
}

export { EventEmitter } from 'events.ts'
