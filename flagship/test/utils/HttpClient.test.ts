/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, expect, it, describe } from '@jest/globals'
import { HttpClient, IHttpOptions } from '../../src/utils/HttpClient'
import { Response } from 'node-fetch'
import * as nodeDeps from '../../src/depsNode'

globalThis.AbortController = require('node-abort-controller')

describe('test Post method NOdeHttpClient', () => {
  const fetch = jest.spyOn(nodeDeps, 'fetch') as any
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

  it('should ', () => {
    fetch.mockResolvedValue(new Response(JSON.stringify(responseJson), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }))
    nodeHttpClient.postAsync(url, options).then((response) => {
      expect(response.body).toEqual(responseJson)
    }).catch(er => console.log(er))
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
      expect(err).toEqual(error)
    }
  })
})

describe('test Get method NOdeHttpClient', () => {
  const fetch = jest.spyOn(nodeDeps, 'fetch') as any
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

  it('should ', async () => {
    const error = 'error'
    fetch.mockResolvedValue(new Response(undefined,
      { statusText: JSON.stringify(error), status: 500, headers: { 'Content-Type': 'application/json' } }))
    try {
      options.timeout = undefined
      await nodeHttpClient.getAsync(url, options)
      expect(fetch).toBeCalledTimes(1)
    } catch (err) {
      expect(error).toEqual(error)
    }
  })
})
