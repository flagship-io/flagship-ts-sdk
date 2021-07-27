import { IHttpClient, IHttpOptions, IHttpResponse } from './httpClient.ts'
import axios from 'axios'
import { REQUEST_TIME_OUT } from '../enum.ts'

export class HttpClient implements IHttpClient {
  public postAsync (url: string, options: IHttpOptions): Promise<IHttpResponse> {
    return new Promise<IHttpResponse>((resolve, reject) => {
      axios
        .post(url, options.body, {
          headers: options.headers,
          timeout: options.timeout ? options.timeout * 1000 : REQUEST_TIME_OUT * 1000
        })
        .then(async (response) => {
          resolve({
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
