import { Agent as HttpAgent } from 'http'
import { Agent as HttpAgents } from 'https'
import myFetch from 'node-fetch'

function getHttpAgent ():Record<string, unknown> {
  const globalOption:Record<string, unknown> = {}
  if (typeof window === 'undefined') {
    globalOption.agent = (parsedURL:URL) => {
      return parsedURL.protocol === 'http:' ? new HttpAgent({ keepAlive: true }) : new HttpAgents({ keepAlive: true })
    }
  }
  return globalOption
}

export const fetch = async (input: URL | RequestInfo, init?: RequestInit): Promise<Response> => {
  const globalOption:Record<string, unknown> = getHttpAgent()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return myFetch(input as any, {
    ...globalOption,
    ...init
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as any
}

export { EventEmitter } from 'events'
export * from 'node-abort-controller'
