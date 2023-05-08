import { Agent as HttpAgent } from 'http.ts'
import { Agent as HttpAgents } from 'https.ts'
import fetch from 'node-fetch'

function getHttpAgent ():Record<string, unknown> {
  const globalOption:Record<string, unknown> = {}
  if (typeof window === 'undefined') {
    globalOption.agent = (parsedURL:URL) => {
      return parsedURL.protocol === 'http:' ? new HttpAgent({ keepAlive: true }) : new HttpAgents({ keepAlive: true })
    }
  }
  return globalOption
}

export const myFetch = async (input: URL | RequestInfo, init?: RequestInit): Promise<Response> => {
  const globalOption:Record<string, unknown> = getHttpAgent()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return fetch(input as any, {
    ...globalOption,
    ...init
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as any
}

export { EventEmitter } from 'events.ts'
export { AbortController as LocalAbortController } from 'node-abort-controller.ts'
