import axios from 'axios'

import { Agent as HttpsAgent } from 'https.ts'
import { Agent as HttpAgent } from 'http.ts'

export const axiosInstance = axios.create({
  httpAgent: new HttpAgent({ keepAlive: true }),
  httpsAgent: new HttpsAgent({ keepAlive: true })
})

export const defaultAxios = axios

export { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios.ts'

export { EventEmitter } from 'events.ts'
