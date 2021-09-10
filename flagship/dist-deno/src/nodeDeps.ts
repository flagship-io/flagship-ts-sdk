import axios from 'axios'

export const axiosInstance = axios.create({})

if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Agent: HttpAgent } = require('http')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Agent: HttpAgents } = require('https')
  axiosInstance.defaults.httpAgent = new HttpAgent({ keepAlive: true })
  axiosInstance.defaults.httpsAgent = new HttpAgents({ keepAlive: true })
}

export const defaultAxios = axios

export { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios.ts'

export { EventEmitter } from 'events.ts'
