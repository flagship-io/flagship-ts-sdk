/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, expect, it, describe } from '@jest/globals'
import { HttpClient, IHttpOptions } from '../../src/utils/HttpClient'
import { Response } from 'node-fetch'
import * as nodeDeps from '../../src/nodeDeps'

globalThis.AbortController = require('abort-controller')

describe('test Post method NOdeHttpClient', () => {
  const fetch = jest.spyOn(nodeDeps, 'fetch')
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
    fetch.mockResolvedValue(new Response(JSON.stringify(responseJson), { status: 200 }))
    nodeHttpClient.postAsync(url, options).then((response) => {
      expect(response.body).toEqual(JSON.stringify(responseJson))
    })
  })

  it('should ', async () => {
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
      console.log(error)

      expect(err).toEqual(error)
    }
  })
})

describe('test Get method NOdeHttpClient', () => {
  const fetch = jest.spyOn(nodeDeps, 'fetch')
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
    fetch.mockResolvedValue(new Response(JSON.stringify(responseJson), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    nodeHttpClient.getAsync(url, options).then((response) => {
      expect(response.body).toEqual(responseJson)
    })
  })

  it('should ', async () => {
    const error = 'error'
    fetch.mockRejectedValue(new Response(JSON.stringify(error),
      { status: 500, headers: { 'Content-Type': 'application/json' } }))
    try {
      options.timeout = undefined
      await nodeHttpClient.getAsync(url, options)
      expect(fetch).toBeCalledTimes(1)
    } catch (err) {
      expect(error).toEqual(error)
    }
  })
})
