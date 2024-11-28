import { jest, describe, it, expect } from '@jest/globals'
import { DecisionApiConfig } from '../../src'
import { CDN_ACCOUNT_SETTINGS_URL } from '../../src/enum'
import { ApiSdkManager } from '../../src/main/ApiSdkManager'
import { EAIConfig } from '../../src/type.local'
import { HttpClient } from '../../src/utils/HttpClient'
import { sprintf } from '../../src/utils/utils'
import { TrackingManager } from '../../src/api/TrackingManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'

describe('ApiSdkManager', () => {
  const httpClient = new HttpClient()
  const sdkConfig = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  const trackingManager = new TrackingManager(httpClient, sdkConfig)
  const apiSdkManager = new ApiSdkManager({ httpClient, sdkConfig, trackingManager, flagshipInstanceId: 'flagshipInstanceId' })
  const logManager = new FlagshipLogManager()
  sdkConfig.logManager = logManager

  const errorLog = jest.spyOn(logManager, 'error')

  const getAsyncSpy = jest.spyOn(httpClient, 'getAsync')

  it('resetSdk should set _EAIConfig to undefined', () => {
    expect(apiSdkManager.getEAIConfig()).toBeUndefined()
  })

  it('getBucketingContent should return undefined', () => {
    const result = apiSdkManager.getBucketingContent()
    expect(result).toBeUndefined()
  })

  describe('initSdk', () => {
    it('should fetch and set EAIConfig successfully', async () => {
      const mockConfig: EAIConfig = {
        eaiActivationEnabled: true,
        eaiCollectEnabled: true
      }

      getAsyncSpy.mockResolvedValue({ body: mockConfig, status: 200 })

      await apiSdkManager.initSdk()

      const url = sprintf(CDN_ACCOUNT_SETTINGS_URL, sdkConfig.envId)
      expect(getAsyncSpy).toHaveBeenCalledTimes(1)
      expect(getAsyncSpy).toHaveBeenCalledWith(url)
      expect(apiSdkManager.getEAIConfig()).toBe(mockConfig)
    })

    it('should log error if fetching EAIConfig fails', async () => {
      const apiSdkManager = new ApiSdkManager({ httpClient, sdkConfig, trackingManager, flagshipInstanceId: 'flagshipInstanceId' })
      const mockError = new Error('Fetch failed')
      getAsyncSpy.mockRejectedValue(mockError)

      await apiSdkManager.initSdk()

      expect(getAsyncSpy).toBeCalledTimes(1)
      expect(apiSdkManager.getEAIConfig()).toBeUndefined()
      expect(errorLog).toHaveBeenCalledTimes(1)
    })
  })

  describe('resetSdk', () => {
    it('should fetch and set EAIConfig successfully then reset it', async () => {
      const mockConfig: EAIConfig = {
        eaiActivationEnabled: true,
        eaiCollectEnabled: true
      }

      getAsyncSpy.mockResolvedValue({ body: mockConfig, status: 200 })

      await apiSdkManager.initSdk()

      expect(getAsyncSpy).toHaveBeenCalledTimes(1)
      expect(apiSdkManager.getEAIConfig()).toBe(mockConfig)

      apiSdkManager.resetSdk()
      expect(apiSdkManager.getEAIConfig()).toBeUndefined()
    })
  })
})
