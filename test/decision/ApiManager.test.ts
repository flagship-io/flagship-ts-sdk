import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
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
  SDK_INFO,
  URL_CAMPAIGNS
} from '../../src/enum/index'
import { IHttpResponse, HttpClient } from '../../src/utils/HttpClient'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { campaigns } from './campaigns'
import { CampaignDTO } from '../../src'
import { errorFormat } from '../../src/utils/utils'

describe('test ApiManager', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const httpClient = new HttpClient()
  const postAsync = jest.spyOn(httpClient, 'postAsync')
  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  const apiManager = new ApiManager(httpClient, config)
  const trackingManager = new TrackingManager(httpClient, config)

  const visitorId = 'visitorId'
  const context = { age: 20 }

  const visitor = new VisitorDelegate({ hasConsented: true, visitorId, context, configManager: { config, decisionManager: apiManager, trackingManager } })

  const campaignResponse = { status: 200, body: campaigns }

  const responseError: IHttpResponse = { status: 400, body: null }

  // Test http request data
  const headers = {
    [HEADER_X_API_KEY]: `${config.apiKey}`,
    [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
    [HEADER_X_SDK_VERSION]: SDK_INFO.version,
    [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
  }
  const postData = {
    visitorId: visitor.visitorId,
    anonymousId: visitor.anonymousId,
    trigger_hit: false,
    context: visitor.context,
    visitor_consent: visitor.hasConsented
  }
  const url = `${BASE_API_URL}${config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true&extras[]=accountSettings`

  it('test panic mode ', async () => {
    const apiManager = new ApiManager(httpClient, config)
    const panicModeResponse = { status: 200, body: { panic: true } }

    postAsync.mockResolvedValue(panicModeResponse)
    apiManager.statusChangedCallback((status) => {
      expect(status).toBe(FlagshipStatus.READY_PANIC_ON)
    })
    const campaigns = await apiManager.getCampaignsAsync(visitor)

    expect(postAsync).toHaveBeenCalledWith(url, {
      headers,
      nextFetchConfig: {
        revalidate: 20
      },
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
      headers,
      nextFetchConfig: {
        revalidate: 20
      },
      timeout: config.timeout,
      body: postData
    })

    expect(modifications.size).toBe(4)
    expect(modifications.get('array')?.value).toEqual([1, 1, 1])
    expect(modifications.get('object')?.value).toEqual({ value: 123456 })
    expect(apiManager.troubleshooting?.startDate.toISOString()).toBe('2023-04-13T09:33:38.049Z')
    expect(apiManager.troubleshooting?.endDate.toISOString()).toBe('2023-04-13T10:03:38.049Z')
    expect(apiManager.troubleshooting?.traffic).toBe(40)
  })

  it('Test error ', async () => {
    postAsync.mockRejectedValue(responseError)

    try {
      await apiManager.getCampaignsAsync(visitor)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err:any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(err.message).toEqual(errorFormat(responseError as any, {
        url,
        headers,
        body: postData,
        duration: 0
      }))
    }
  })

  it('test campaign with consent false', async () => {
    config.decisionApiUrl = 'http://new_decision_api_url'
    const url = `${config.decisionApiUrl}${config.envId}${URL_CAMPAIGNS}?${EXPOSE_ALL_KEYS}=true&extras[]=accountSettings`
    postAsync.mockResolvedValue(campaignResponse)

    visitor.setConsent(false)

    const campaigns = await apiManager.getCampaignsAsync(
      visitor
    )
    const modifications = apiManager.getModifications(campaigns as CampaignDTO[])

    expect(postAsync).toHaveBeenCalledWith(url, {
      headers,
      nextFetchConfig: {
        revalidate: 20
      },
      timeout: config.timeout,
      body: { ...postData, visitor_consent: visitor.hasConsented }
    })

    expect(modifications.size).toBe(4)
    expect(modifications.get('array')?.value).toEqual([1, 1, 1])
    expect(modifications.get('object')?.value).toEqual({ value: 123456 })
  })
})
