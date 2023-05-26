import { HttpError } from './HttpError'
import { REQUEST_TIME_OUT } from '../enum/index'
import { myFetch, LocalAbortController } from '../depsNode.native'

export interface IHttpOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface IHttpResponse {
  status: number;
  headers?: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

export interface IHttpClient {
  postAsync(url: string, options: IHttpOptions): Promise<IHttpResponse>;
  getAsync(url: string, options?: IHttpOptions): Promise<IHttpResponse>;
}

export class HttpClient implements IHttpClient {
  private async getResponse (response:Response) {
    const applicationType = response.headers.get('Content-Type')
    const checkJson = applicationType === 'application/json'
    let body:Record<string, unknown>|undefined
    const headers:Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    if (checkJson && response.ok && response.status !== 204) {
      body = await response.json()
    }

    if (response.status >= 400) {
      const bodyString = await response.text()
      throw new HttpError(response.status, bodyString || response.statusText, headers)
    }

    return {
      status: response.status,
      body,
      headers
    }
  }

  async getAsync (url: string, options?: IHttpOptions): Promise<IHttpResponse> {
    const c = new LocalAbortController()
    const id = setTimeout(() => c.abort(), (options?.timeout ? options.timeout : REQUEST_TIME_OUT) * 1000)
    try {
      const response = await myFetch(url, {
        method: 'GET',
        headers: options?.headers,
        signal: c.signal as AbortSignal,
        keepalive: true
      })
      return this.getResponse(response)
    } finally {
      clearTimeout(id)
    }
  }

  public async postAsync (url: string, options: IHttpOptions): Promise<IHttpResponse> {
    const c = new LocalAbortController()
    const id = setTimeout(() => c.abort(), options.timeout ? options.timeout * 1000 : REQUEST_TIME_OUT * 1000)
    try {
      const response = await myFetch(url, {
        method: 'POST',
        headers: options.headers,
        body: JSON.stringify(options.body),
        signal: c.signal as AbortSignal,
        keepalive: true
      })
      return this.getResponse(response)
    } finally {
      clearTimeout(id)
    }
  }
}
