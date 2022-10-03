import { jest, expect, it, describe } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config/index'
import { HttpClient, IHttpResponse } from '../../src/utils/HttpClient'
import {
  ANONYMOUS_ID,
  BASE_API_URL,
  CUSTOMER_ENV_ID_API_ITEM,
  CUSTOMER_UID,
  DS_API_ITEM,
  EVENT_ACTION_API_ITEM,
  EVENT_CATEGORY_API_ITEM,
  EVENT_LABEL_API_ITEM,
  HEADER_APPLICATION_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_X_API_KEY,
  HEADER_X_SDK_CLIENT,
  HEADER_X_SDK_VERSION,
  HitType,
  HIT_API_URL,
  HIT_CONSENT_URL,
  SDK_APP,
  SDK_INFO,
  T_API_ITEM,
  URL_ACTIVATE_MODIFICATION,
  VARIATION_GROUP_ID_API_ITEM,
  VARIATION_ID_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../../src/enum/index'

import { EventCategory, Page } from '../../src/hit/index'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { ApiManager } from '../../src/decision/ApiManager'
import { DecisionManager } from '../../src/decision/DecisionManager'

// mock NodeHttpClient
jest.mock('../../src/utils/HttpClient')

describe('test TrackingManager sendActive ', () => {
  const httpClient = new HttpClient()

  const postAsync = jest.spyOn(httpClient, 'postAsync')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })

  const trackingManager = new TrackingManager(httpClient, config)

  const sendConsentHit = jest.spyOn(trackingManager, 'sendConsentHit')

  sendConsentHit.mockResolvedValue()

  const visitorId = 'visitorId'
  const context = { age: 20 }

  const visitor = new VisitorDelegate({ visitorId, context, configManager: { config, trackingManager, decisionManager: {} as DecisionManager } })

  const url = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`
  const headers = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
    [HEADER_X_SDK_VERSION]: SDK_INFO.version,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }
  const modification = {
    key: 'key',
    campaignId: 'campaignId',
    variationGroupId: 'variationGroupId',
    variationId: 'variationId',
    isReference: false,
    value: 'value'
  }

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
        headers,
        timeout: config.timeout,
        body: postData
      })

      postAsync.mockRejectedValue(postResponseError)
      await trackingManager.sendActive(visitor, modification)
      expect(postAsync).toHaveBeenCalledWith(url, {
        headers,
        timeout: config.timeout,
        body: postData
      })
    } catch (error) {
      expect(error).toBe(postResponseError)
    }
    expect(postAsync).toHaveBeenCalledTimes(2)
  })

  it('should ', async () => {
    const visitor = new VisitorDelegate({ visitorId, hasConsented: true, isAuthenticated: true, context, configManager: { config, trackingManager, decisionManager: {} as ApiManager } })
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
        headers,
        timeout: config.timeout,
        body: postData
      })

      postAsync.mockRejectedValue(postResponseError)
      await trackingManager.sendActive(visitor, modification)
      expect(postAsync).toHaveBeenCalledWith(url, {
        headers,
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
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const postResponse: IHttpResponse = { status: 204, body: null }

    const postResponseError: IHttpResponse = { status: 400, body: null }

    try {
      postAsync.mockResolvedValue(postResponse)
      await trackingManager.sendHit(hit)
      expect(postAsync).toBeCalledWith(HIT_API_URL, {
        headers,
        timeout: config.timeout,
        body: hit.toApiKeys()
      })

      postAsync.mockRejectedValue(postResponseError)
      await trackingManager.sendHit(hit)
      expect(postAsync).toBeCalledWith(HIT_API_URL, {
        headers,
        timeout: config.timeout,
        body: hit.toApiKeys()
      })
    } catch (error) {
      expect(error).toBe(postResponseError)
    }
    expect(postAsync).toHaveBeenCalledTimes(2)
  })
})

describe('test TrackingManager sendConsentHit ', () => {
  it(' should', async () => {
    const httpClient = new HttpClient()
    const postAsync = jest.spyOn(httpClient, 'postAsync')

    const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
    const trackingManager = new TrackingManager(httpClient, config)

    const headers = {
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const postResponse: IHttpResponse = { status: 204, body: null }

    const postResponseError: IHttpResponse = { status: 400, body: null }

    const configManager = new ConfigManager(config, {} as DecisionManager, trackingManager)

    const visitor = new VisitorDelegate({ visitorId: 'visitorId', hasConsented: true, context: {}, configManager })

    const postBody: Record<string, unknown> = {
      [T_API_ITEM]: HitType.EVENT,
      [EVENT_LABEL_API_ITEM]: `${SDK_INFO.name}:${visitor.hasConsented}`,
      [EVENT_ACTION_API_ITEM]: 'fs_consent',
      [EVENT_CATEGORY_API_ITEM]: EventCategory.USER_ENGAGEMENT,
      [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
      [DS_API_ITEM]: SDK_APP,
      [VISITOR_ID_API_ITEM]: visitor.visitorId,
      [CUSTOMER_UID]: null
    }

    postAsync.mockResolvedValue(postResponse)

    await trackingManager.sendConsentHit(visitor)

    expect(postAsync).toBeCalledWith(HIT_CONSENT_URL, {
      headers,
      timeout: config.timeout,
      body: postBody
    })

    postAsync.mockRejectedValue(postResponseError)
    try {
      await trackingManager.sendConsentHit(visitor)
    } catch (error) {
      expect(error).toBe(postResponseError)
    }

    visitor.authenticate('visitorIdAuth')
    postBody[VISITOR_ID_API_ITEM] = visitor.anonymousId
    postBody[CUSTOMER_UID] = visitor.visitorId
    postAsync.mockResolvedValue(postResponse)
    await trackingManager.sendConsentHit(visitor)
    expect(postAsync).toBeCalledWith(HIT_CONSENT_URL, {
      headers,
      timeout: config.timeout,
      body: postBody
    })
    expect(postAsync).toHaveBeenCalledTimes(4)
  })
})
