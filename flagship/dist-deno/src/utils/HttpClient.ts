import { REQUEST_TIME_OUT } from '../enum/index.ts'
import { fetch, globalOption } from '../deps.ts'

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
    let body = await response.text()

    if (body && checkJson) {
      body = JSON.parse(body)
    }

    if (!response.ok) {
      throw new Error(body || response.statusText)
    }
    return {
      status: response.status,
      body: body
    }
  }

  getAsync (url: string, options?: IHttpOptions): Promise<IHttpResponse> {
    const c = new AbortController()
    const id = setTimeout(() => c.abort(), (options?.timeout ? options.timeout : REQUEST_TIME_OUT) * 1000)
    return fetch(url, {
      ...globalOption,
      method: 'GET',
      headers: options?.headers,
      signal: c.signal,
      keepalive: true
    })
      .then(this.getResponse)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((error:any) => {
        throw error
      })
      .finally(() => {
        clearInterval(id)
      })
  }

  public postAsync (url: string, options: IHttpOptions): Promise<IHttpResponse> {
    const c = new AbortController()
    const id = setTimeout(() => c.abort(), options.timeout ? options.timeout * 1000 : REQUEST_TIME_OUT * 1000)
    return fetch(url, {
      ...globalOption,
      method: 'POST',
      headers: options.headers,
      body: JSON.stringify(options.body),
      signal: c.signal,
      keepalive: true
    })
      .then(this.getResponse)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((error: any) => {
        throw error
      })
      .finally(() => {
        clearInterval(id)
      })
  }
}
