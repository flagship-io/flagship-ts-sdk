import { jest, expect, it, describe } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config/index'
import { HttpClient } from '../../src/utils/NodeHttpClient'
import { Modification } from '../../src/model/Modification'
import {
  ANONYMOUS_ID,
  BASE_API_URL,
  CUSTOMER_ENV_ID_API_ITEM,
  HEADER_APPLICATION_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_X_API_KEY,
  HEADER_X_SDK_CLIENT,
  HEADER_X_SDK_VERSION,
  HIT_API_URL,
  SDK_LANGUAGE,
  SDK_VERSION,
  URL_ACTIVATE_MODIFICATION,
  VARIATION_GROUP_ID_API_ITEM,
  VARIATION_ID_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../../src/enum/index'
import { IHttpResponse } from '../../src/utils/httpClient'
import { Page } from '../../src/hit/index'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { ApiManager } from '../../src/decision/ApiManager'
import { DecisionManager } from '../../src/decision/DecisionManager'

// mock NodeHttpClient
jest.mock('../../src/utils/NodeHttpClient')

describe('test TrackingManager sendActive ', () => {
  const httpClient = new HttpClient()

  const postAsync = jest.spyOn(httpClient, 'postAsync')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })

  const trackingManager = new TrackingManager(httpClient, config)

  const visitorId = 'visitorId'
  const context = { age: 20 }

  const visitor = new VisitorDelegate({ visitorId, context, configManager: { config, trackingManager, decisionManager: {} as DecisionManager } })

  const url = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`
  const headers = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }
  const modification = new Modification(
    'key',
    'campaignId',
    'variationGroupId',
    'variationId',
    false,
    'value'
  )

  const postResponse: IHttpResponse = { status: 204, body: null }
  const postResponseError: IHttpResponse = { status: 400, body: null }

  it('should ', async () => {
    expect(config).toBe(trackingManager.config)
    expect(httpClient).toBe(trackingManager.httpClient)

    // Test http request data

    const postData = {
      [VISITOR_ID_API_ITEM]: visitor.visitorId,
      [VARIATION_ID_API_ITEM]: modification.variationId,
      [VARIATION_GROUP_ID_API_ITEM]: modification.variationGroupId,
      [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
      [ANONYMOUS_ID]: visitor.anonymousId
    }

    try {
      postAsync.mockResolvedValue(postResponse)
      await trackingManager.sendActive(visitor, modification)

      expect(postAsync).toHaveBeenCalledWith(url, {
        headers: headers,
        timeout: config.timeout,
        body: postData
      })

      postAsync.mockRejectedValue(postResponseError)
      await trackingManager.sendActive(visitor, modification)
      expect(postAsync).toHaveBeenCalledWith(url, {
        headers: headers,
        timeout: config.timeout,
        body: postData
      })
    } catch (error) {
      expect(error).toBe(postResponseError)
    }
    expect(postAsync).toHaveBeenCalledTimes(2)
  })

  it('should ', async () => {
    const visitor = new VisitorDelegate({ visitorId, isAuthenticated: true, context, configManager: { config, trackingManager, decisionManager: {} as ApiManager } })
    const postData = {
      [VISITOR_ID_API_ITEM]: visitor.visitorId,
      [VARIATION_ID_API_ITEM]: modification.variationId,
      [VARIATION_GROUP_ID_API_ITEM]: modification.variationGroupId,
      [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
      [ANONYMOUS_ID]: visitor.anonymousId
    }

    try {
      postAsync.mockResolvedValue(postResponse)
      await trackingManager.sendActive(visitor, modification)

      expect(postAsync).toHaveBeenCalledWith(url, {
        headers: headers,
        timeout: config.timeout,
        body: postData
      })

      postAsync.mockRejectedValue(postResponseError)
      await trackingManager.sendActive(visitor, modification)
      expect(postAsync).toHaveBeenCalledWith(url, {
        headers: headers,
        timeout: config.timeout,
        body: postData
      })
    } catch (error) {
      expect(error).toBe(postResponseError)
    }
    expect(postAsync).toHaveBeenCalledTimes(2)
  })
})

describe('test TrackingManager sendHit ', () => {
  it(' should', async () => {
    const httpClient = new HttpClient()
    const postAsync = jest.spyOn(httpClient, 'postAsync')

    const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
    const trackingManager = new TrackingManager(httpClient, config)

    const hit = new Page({ documentLocation: 'url' })
    hit.config = config

    const headers = {
      [HEADER_X_API_KEY]: `${config.apiKey}`,
      [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
      [HEADER_X_SDK_VERSION]: SDK_VERSION,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const postResponse: IHttpResponse = { status: 204, body: null }

    const postResponseError: IHttpResponse = { status: 400, body: null }

    try {
      postAsync.mockResolvedValue(postResponse)
      await trackingManager.sendHit(hit)
      expect(postAsync).toBeCalledWith(HIT_API_URL, {
        headers: headers,
        timeout: config.timeout,
        body: hit.toApiKeys()
      })

      postAsync.mockRejectedValue(postResponseError)
      await trackingManager.sendHit(hit)
      expect(postAsync).toBeCalledWith(HIT_API_URL, {
        headers: headers,
        timeout: config.timeout,
        body: hit.toApiKeys()
      })
    } catch (error) {
      expect(error).toBe(postResponseError)
    }
    expect(postAsync).toHaveBeenCalledTimes(2)
  })
})
