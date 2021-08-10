/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, expect, it, describe } from '@jest/globals'
import { HttpClient } from '../../src/utils/NodeHttpClient'
import { IHttpOptions } from '../../src/utils/httpClient'
import axios, {
  AxiosError,
  AxiosRequestConfig
} from 'axios'
import { Mock } from 'jest-mock'

describe('test Post method NOdeHttpClient', () => {
  const axiosPost: Mock<
    Promise<any>,
    [url: string, data?: any, config?: AxiosRequestConfig]
  > = jest.fn()

  axios.post = axiosPost

  const nodeHttpClient = new HttpClient()
  const url = 'https://localhost'
  const timeout = 2000
  const options: IHttpOptions = {
    timeout: timeout,
    headers: {
      'x-api-toke': 'token'
    },
    body: {
      ct: 20
    }
  }

  const responseJson = { isVip: true }

  it('should ', () => {
    axiosPost.mockResolvedValue({ data: responseJson, status: 200 })
    nodeHttpClient.postAsync(url, options).then((response) => {
      expect(response.body).toEqual(responseJson)
    })
  })

  it('should ', async () => {
    const error: AxiosError = {
      config: {},
      isAxiosError: true,
      toJSON: jest.fn(),
      name: 'error',
      message: 'error'
    }
    axiosPost.mockRejectedValue(error)
    try {
      options.timeout = undefined
      await nodeHttpClient.postAsync(url, options)
      expect(axiosPost).toBeCalledTimes(1)
    } catch (error) {
      expect(error).toBe('error')
    }
  })
})

describe('test Get method NOdeHttpClient', () => {
  const axiosGet: Mock<
    Promise<any>,
    [url: string, config?: AxiosRequestConfig]
  > = jest.fn()

  axios.get = axiosGet

  const nodeHttpClient = new HttpClient()
  const url = 'https://localhost'
  const timeout = 2000
  const options: IHttpOptions = {
    timeout: timeout,
    headers: {
      'x-api-toke': 'token'
    }
  }

  const responseJson = { isVip: true }

  it('should ', () => {
    axiosGet.mockResolvedValue({ data: responseJson, status: 200 })
    nodeHttpClient.getAsync(url, options).then((response) => {
      expect(response.body).toEqual(responseJson)
    })
  })

  it('should ', async () => {
    const error: AxiosError = {
      config: {},
      isAxiosError: true,
      toJSON: jest.fn(),
      name: 'error',
      message: 'error'
    }
    axiosGet.mockRejectedValue(error)
    try {
      options.timeout = undefined
      await nodeHttpClient.getAsync(url, options)
      expect(axiosGet).toBeCalledTimes(1)
    } catch (error) {
      expect(error).toBe('error')
    }
  })
})
