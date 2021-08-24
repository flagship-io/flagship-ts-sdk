import { IHttpClient, IHttpOptions, IHttpResponse } from './httpClient.ts'
import axios, { AxiosResponse } from 'axios'
import { REQUEST_TIME_OUT } from '../enum.ts'

export class HttpClient implements IHttpClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getResponse (response:AxiosResponse<any>) {
    return {
      headers: response.headers,
      status: response.status,
      body: response.data
    }
  }

  getAsync (url: string, options?: IHttpOptions): Promise<IHttpResponse> {
    return new Promise<IHttpResponse>((resolve, reject) => {
      axios.get(url, {
        validateStatus: function (status) {
          return status < 400
        },
        headers: options?.headers,
        timeout: options?.timeout ? options.timeout * 1000 : REQUEST_TIME_OUT * 1000
      })
        .then(response => {
          resolve(this.getResponse(response))
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
          resolve(this.getResponse(response))
        })
        .catch((error) => {
          reject(error.message)
        })
    })
  }
}
