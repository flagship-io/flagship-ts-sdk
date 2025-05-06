import fetch from 'node-fetch';

function getHttpAgent():Record<string, unknown> {
  const globalOption:Record<string, unknown> = {};
  if (typeof window === 'undefined') {

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Agent: HttpAgent } = require('http');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Agent: HttpAgents } = require('https');
    globalOption.agent = (parsedURL:URL) => {
      return parsedURL.protocol === 'http:' ? new HttpAgent({ keepAlive: true }) : new HttpAgents({ keepAlive: true });
    };
  }
  return globalOption;
}

export const myFetch = async (input: URL | RequestInfo, init?: RequestInit): Promise<Response> => {
  const globalOption:Record<string, unknown> = getHttpAgent();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return fetch(input as any, {
    ...globalOption,
    ...init
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as any;
};

export { EventEmitter } from 'events';
export { AbortController as LocalAbortController } from 'node-abort-controller';
