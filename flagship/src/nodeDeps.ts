import axios from 'axios'

import { Agent as HttpsAgent } from 'https'
import { Agent as HttpAgent } from 'http'

export const axiosInstance = axios.create({
  httpAgent: new HttpAgent({ keepAlive: true }),
  httpsAgent: new HttpsAgent({ keepAlive: true })
})

export const defaultAxios = axios

export { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios'

export { EventEmitter } from 'events'
