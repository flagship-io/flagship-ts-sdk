import { IHttpClient, IHttpOptions, IHttpResponse } from './httpClient.ts'
import { AxiosResponse, axiosInstance } from '../deps.ts'
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
      axiosInstance.get(url, {
        validateStatus: (status) => status < 400,
        headers: options?.headers,
        timeout: (options?.timeout ? options.timeout : REQUEST_TIME_OUT) * 1000
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
      axiosInstance
        .post(url, options.body, {
          validateStatus: (status) => status < 400,
          headers: options.headers,
          timeout: (options?.timeout ? options.timeout : REQUEST_TIME_OUT) * 1000
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
