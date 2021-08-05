import { IHttpClient, IHttpOptions, IHttpResponse } from './httpClient'
import axios from 'axios'
import { REQUEST_TIME_OUT } from '../enum'

export class HttpClient implements IHttpClient {
  getAsync (url: string, options?: IHttpOptions): Promise<IHttpResponse> {
    return new Promise<IHttpResponse>((resolve, reject) => {
      axios.get(url, {
        headers: options?.headers,
        timeout: options?.timeout ? options.timeout * 1000 : REQUEST_TIME_OUT * 1000
      })
        .then(response => {
          resolve({
            headers: response.headers,
            status: response.status,
            body: response.data
          })
        }).catch(error => {
          reject(error.message)
        })
    })
  }

  public postAsync (url: string, options: IHttpOptions): Promise<IHttpResponse> {
    return new Promise<IHttpResponse>((resolve, reject) => {
      axios
        .post(url, options.body, {
          headers: options.headers,
          timeout: options.timeout ? options.timeout * 1000 : REQUEST_TIME_OUT * 1000
        })
        .then((response) => {
          resolve({
            headers: response.headers,
            status: response.status,
            body: response.data
          })
        })
        .catch((error) => {
          reject(error.message)
        })
    })
  }
}
