import { REQUEST_TIME_OUT } from '../enum/index.ts'
import { IHttpClient, IHttpOptions, IHttpResponse } from './httpClient.ts'

export class HttpClient implements IHttpClient {
  getAsync (url: string, options?: IHttpOptions): Promise<IHttpResponse> {
    return new Promise<IHttpResponse>((resolve, reject) => {
      const c = new AbortController()
      const id = setTimeout(() => c.abort(), (options?.timeout ? options.timeout : REQUEST_TIME_OUT) * 1000)
      fetch(url, {
        method: 'GET',
        headers: options?.headers,
        signal: c.signal
      })
        .then(async (response) => {
          const applicationType = response.headers.get('Content-Type')
          const checkJson = applicationType === 'application/json'
          const body = checkJson
            ? await response.json()
            : await response.text()

          if (!response.ok) {
            reject(new Error(body || response.statusText).message)
            return
          }

          resolve({
            status: response.status,
            body: body
          })
        })
        .catch((error) => {
          reject(error.message)
        })
        .finally(() => {
          clearInterval(id)
        })
    })
  }

  public postAsync (url: string, options: IHttpOptions): Promise<IHttpResponse> {
    return new Promise<IHttpResponse>((resolve, reject) => {
      const c = new AbortController()
      const id = setTimeout(() => c.abort(), options.timeout ? options.timeout * 1000 : REQUEST_TIME_OUT * 1000)
      fetch(url, {
        method: 'POST',
        headers: options.headers,
        body: JSON.stringify(options.body),
        signal: c.signal
      })
        .then(async (response) => {
          const applicationType = response.headers.get('Content-Type')
          const checkJson = applicationType === 'application/json'
          const body = checkJson
            ? await response.json()
            : await response.text()

          if (!response.ok) {
            reject(new Error(body || response.statusText).message)
            return
          }

          resolve({
            status: response.status,
            body: body
          })
        })
        .catch((error) => {
          reject(error.message)
        })
        .finally(() => {
          clearInterval(id)
        })
    })
  }
}
