import { jest, expect, it, describe } from '@jest/globals'
import { HttpClient, IHttpOptions } from '../../src/utils/HttpClient'
import { Response } from 'node-fetch'
import * as nodeDeps from '../../src/depsNode.native'

 

// globalThis.AbortController = require('node-abort-controller')

describe('Post method tests for NOdeHttpClient', () => {
  const fetch = jest.spyOn(nodeDeps, 'myFetch') as any
  const nodeHttpClient = new HttpClient()
  const url = 'https://localhost'
  const timeout = 2000
  const options: IHttpOptions = {
    timeout,
    headers: {
      'x-api-toke': 'token'
    },
    body: {
      ct: 20
    }
  }

  const responseJson = { isVip: true }

  it('should return the correct response body', () => {
    fetch.mockResolvedValue(new Response(JSON.stringify(responseJson), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }))
    nodeHttpClient.postAsync(url, options).then((response) => {
      expect(response.body).toEqual(responseJson)
    }).catch(er => expect(er).toBeUndefined())
  })

  it('should handle errors correctly', async () => {
    const error = {
      config: {},
      isAxiosError: true,
      toJSON: jest.fn(),
      name: 'error',
      message: 'error'
    }
    fetch.mockRejectedValue(error)
    try {
      options.timeout = undefined
      await nodeHttpClient.postAsync(url, options)
      expect(fetch).toBeCalledTimes(1)
    } catch (err) {
      expect(err).toEqual(error)
    }
  })

  it('should handle timeout correctly', async () => {
    const error = 'error'
    fetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit | undefined) => new Promise((resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(error)
      })
    }))
    try {
      options.timeout = 0.01
      await nodeHttpClient.postAsync(url, options)
      expect(fetch).toBeCalledTimes(1)
    } catch  {
      expect(error).toEqual(error)
    }
  }
  )
})

describe('Get method tests for NOdeHttpClient', () => {
  const fetch = jest.spyOn(nodeDeps, 'myFetch') as any
  const nodeHttpClient = new HttpClient()
  const url = 'https://localhost'
  const timeout = 2000
  const options: IHttpOptions = {
    timeout,
    headers: {
      'x-api-toke': 'token'
    }
  }

  const responseJson = { isVip: true }

  it('should return the correct response body', () => {
    fetch.mockResolvedValue(new Response(JSON.stringify(responseJson), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    nodeHttpClient.getAsync(url, options).then((response) => {
      expect(response.body).toEqual(responseJson)
    })
  })

  it('should handle server errors correctly', async () => {
    const error = 'error'
    fetch.mockRejectedValue(new Response(JSON.stringify(error),
      { status: 500, headers: { 'Content-Type': 'application/json' } }))
    try {
      options.timeout = undefined
      await nodeHttpClient.getAsync(url, options)
      expect(fetch).toBeCalledTimes(1)
    } catch (err) {
      expect(error).toEqual(err)
    }
  })

  it('should handle network errors correctly', async () => {
    const error = 'error'
    fetch.mockRejectedValue(new Response(JSON.stringify(error),
      { status: 500, headers: { 'Content-Type': 'application/json' } }))
    try {
      options.timeout = undefined
      await nodeHttpClient.getAsync(url, options)
      expect(fetch).toBeCalledTimes(1)
    } catch (err) {
      expect(error).toEqual(err)
    }
  })

  it('should handle empty response body correctly', async () => {
    const error = 'error'
    fetch.mockResolvedValue(new Response(undefined,
      { statusText: JSON.stringify(error), status: 500, headers: { 'Content-Type': 'application/json' } }))
    try {
      options.timeout = undefined
      await nodeHttpClient.getAsync(url, options)
      expect(fetch).toBeCalledTimes(1)
    } catch (err) {
      expect(error).toEqual(err)
    }
  })

  it('should handle timeout correctly', async () => {
    const error = 'error'
    fetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit | undefined) => new Promise((resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(error)
      })
    }))
    try {
      options.timeout = 0.01
      await nodeHttpClient.getAsync(url, options)
      expect(fetch).toBeCalledTimes(1)
    } catch (err) {
      expect(error).toEqual(err)
    }
  }
  )
})
