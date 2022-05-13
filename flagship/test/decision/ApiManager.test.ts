import { jest, expect, it, describe } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { DecisionApiConfig } from '../../src/config/index'
import { ApiManager } from '../../src/decision/ApiManager'
import {
  BASE_API_URL,
  EXPOSE_ALL_KEYS,
  FlagshipStatus,
  HEADER_APPLICATION_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_X_API_KEY,
  HEADER_X_SDK_CLIENT,
  HEADER_X_SDK_VERSION,
  SDK_LANGUAGE,
  SDK_VERSION,
  SEND_CONTEXT_EVENT,
  URL_CAMPAIGNS
} from '../../src/enum/index'
import { IHttpResponse, HttpClient } from '../../src/utils/HttpClient'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { campaigns } from './campaigns'
import { Mock } from 'jest-mock'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'
import { CampaignDTO } from '../../src'

describe('test ApiManager', () => {
  const httpClient = new HttpClient()
  const postAsync = jest.spyOn(httpClient, 'postAsync')
  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  const apiManager = new ApiManager(httpClient, config)
  const trackingManager = new TrackingManager(httpClient, config)

  const sendConsentHit: Mock<Promise<void>, [visitor: VisitorAbstract]> = jest.fn()

  sendConsentHit.mockResolvedValue()

  trackingManager.sendConsentHit = sendConsentHit

  const visitorId = 'visitorId'
  const context = { age: 20 }

  const visitor = new VisitorDelegate({ hasConsented: true, visitorId, context, configManager: { config, decisionManager: apiManager, trackingManager: trackingManager } })

  const campaignResponse = { status: 200, body: campaigns }

  const responseError: IHttpResponse = { status: 400, body: null }

  // Test http request data
  const headers = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
    [HEADER_X_SDK_VERSION]: SDK_VERSION,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }
  const postData = {
    visitorId: visitor.visitorId,
    anonymousId: visitor.anonymousId,
    trigger_hit: false,
    context: visitor.context
  }
  const url = `${BASE_API_URL}${config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true`

  it('test panic mode ', async () => {
    const apiManager = new ApiManager(httpClient, config)
    const panicModeResponse = { status: 200, body: { panic: true } }

    postAsync.mockResolvedValue(panicModeResponse)
    apiManager.statusChangedCallback((status) => {
      expect(status).toBe(FlagshipStatus.READY_PANIC_ON)
    })
    const campaigns = await apiManager.getCampaignsAsync(visitor)
    
    expect(postAsync).toHaveBeenCalledWith(url, {
      headers: headers,
      timeout: config.timeout,
      body: postData
    })

    expect(campaigns).toBeNull()
    expect(apiManager.isPanic()).toBeTruthy()
  })

  it('test campaign', async () => {
    postAsync.mockResolvedValue(campaignResponse)

    const campaigns = await apiManager.getCampaignsAsync(
      visitor
    )
    const modifications = apiManager.getModifications(campaigns as CampaignDTO[])

    expect(postAsync).toHaveBeenCalledWith(url, {
      headers: headers,
      timeout: config.timeout,
      body: postData
    })

    expect(modifications.size).toBe(4)
    expect(modifications.get('array')?.value).toEqual([1, 1, 1])
    expect(modifications.get('object')?.value).toEqual({ value: 123456 })
  })

  it('test campaign with consent false', async () => {
    config.decisionApiUrl = 'http://new_decision_api_url'
    const url = `${config.decisionApiUrl}${config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true`
    postAsync.mockResolvedValue(campaignResponse)

    visitor.setConsent(false)

    const campaigns = await apiManager.getCampaignsAsync(
      visitor
    )
    const modifications = apiManager.getModifications(campaigns as CampaignDTO[])

    expect(postAsync).toHaveBeenCalledWith(`${url}&${SEND_CONTEXT_EVENT}=false`, {
      headers: headers,
      timeout: config.timeout,
      body: postData
    })

    expect(modifications.size).toBe(4)
    expect(modifications.get('array')?.value).toEqual([1, 1, 1])
    expect(modifications.get('object')?.value).toEqual({ value: 123456 })
  })

  it('Test error ', async () => {
    postAsync.mockRejectedValue(responseError)

    const campaigns = await apiManager.getCampaignsAsync(
      visitor
    )
    expect(campaigns).toBeNull()
  })
})
