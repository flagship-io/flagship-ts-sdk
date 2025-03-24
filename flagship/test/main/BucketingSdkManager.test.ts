import { jest, describe, it, expect } from '@jest/globals'
import { BUCKETING_API_URL, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, LogLevel, SDK_INFO } from '../../src/enum'
import { EAIConfig } from '../../src/type.local'
import { HttpClient } from '../../src/utils/HttpClient'
import { sprintf } from '../../src/utils/utils'
import { TrackingManager } from '../../src/api/TrackingManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { BucketingSdkManager } from '../../src/main/BucketingSdkManager'
import { bucketing } from './bucketing'
import { BucketingConfig } from '../../src/config'
import { TroubleshootingLabel } from '../../src/types'
import { sleep } from '../helpers'

describe('BucketingSdkManager', () => {
  const httpClient = new HttpClient()
  const sdkConfig = new BucketingConfig({ envId: 'envId', apiKey: 'apiKey', pollingInterval: 0 })
  const trackingManager = new TrackingManager(httpClient, sdkConfig)
  const bucketingSdkManager = new BucketingSdkManager({ httpClient, sdkConfig, trackingManager, flagshipInstanceId: 'flagshipInstanceId' })
  const logManager = new FlagshipLogManager()
  sdkConfig.logManager = logManager

  const errorLog = jest.spyOn(logManager, 'error')

  const getAsyncSpy = jest.spyOn(httpClient, 'getAsync')

  it('resetSdk should set _EAIConfig to undefined', () => {
    expect(bucketingSdkManager.getEAIConfig()).toBeUndefined()
  })

  it('getBucketingContent should return undefined', () => {
    const result = bucketingSdkManager.getBucketingContent()
    expect(result).toBeUndefined()
  })

  describe('initSdk', () => {
    it('should fetch and set EAIConfig successfully', async () => {
      const mockConfig: EAIConfig = {
        eaiActivationEnabled: true,
        eaiCollectEnabled: true
      }

      const headers: Record<string, string> = {
        [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
        [HEADER_X_SDK_VERSION]: SDK_INFO.version,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }

      getAsyncSpy.mockResolvedValue({ body: bucketing, status: 200 })

      await bucketingSdkManager.initSdk()

      const url = sprintf(BUCKETING_API_URL, sdkConfig.envId)
      expect(getAsyncSpy).toHaveBeenCalledTimes(1)
      expect(getAsyncSpy).toHaveBeenCalledWith(url, {
        headers,
        timeout: sdkConfig.timeout,
        nextFetchConfig: sdkConfig.nextFetchConfig
      })
      expect(bucketingSdkManager.getEAIConfig()).toEqual(mockConfig)
      expect(bucketingSdkManager.getBucketingContent()).toEqual(bucketing)

      bucketingSdkManager.resetSdk()
      expect(bucketingSdkManager.getEAIConfig()).toBeUndefined()
      expect(bucketingSdkManager.getBucketingContent()).toBeUndefined()
    })

    it('should log error if fetching EAIConfig fails', async () => {
      const bucketingSdkManager = new BucketingSdkManager({ httpClient, sdkConfig, trackingManager, flagshipInstanceId: 'flagshipInstanceId' })
      const mockError = new Error('Fetch failed')
      getAsyncSpy.mockRejectedValue(mockError)

      await bucketingSdkManager.initSdk()

      expect(getAsyncSpy).toBeCalledTimes(1)
      expect(bucketingSdkManager.getEAIConfig()).toBeUndefined()
      expect(errorLog).toHaveBeenCalledTimes(1)
    })
  })
})

describe('BucketingSdkManager with initialBucketing', () => {
  const httpClient = new HttpClient()
  const sdkConfig = new BucketingConfig({ envId: 'envId', apiKey: 'apiKey', pollingInterval: 0, initialBucketing: bucketing })
  const trackingManager = new TrackingManager(httpClient, sdkConfig)
  const bucketingSdkManager = new BucketingSdkManager({ httpClient, sdkConfig, trackingManager, flagshipInstanceId: 'flagshipInstanceId' })
  const logManager = new FlagshipLogManager()
  sdkConfig.logManager = logManager

  it('getBucketingContent should return initialBucketing', () => {
    const result = bucketingSdkManager.getBucketingContent()
    expect(result).toEqual(bucketing)
  })
})

describe('test bucketing polling', () => {
  const httpClient = new HttpClient()
  const getAsyncSpy = jest.spyOn(httpClient, 'getAsync')
  const sdkConfig = new BucketingConfig({ envId: 'envId', apiKey: 'apiKey', logLevel: LogLevel.DEBUG })
  const logManager = new FlagshipLogManager()
  sdkConfig.logManager = logManager
  const trackingManager = new TrackingManager(httpClient, sdkConfig)
  const debugLogSpy = jest.spyOn(logManager, 'debug')

  const bucketingSdkManager = new BucketingSdkManager({
    httpClient,
    sdkConfig,
    trackingManager,
    flagshipInstanceId: 'flagshipInstanceId'
  })

  const addTroubleshootingHitSpy = jest.spyOn(trackingManager, 'addTroubleshootingHit')

  it('should ', async () => {
    addTroubleshootingHitSpy.mockResolvedValue()
    const lastModified = Date.now()
    sdkConfig.pollingInterval = 0.5

    const onBucketingUpdated = jest.fn<(lastUpdate: Date) => void>()
    sdkConfig.onBucketingUpdated = onBucketingUpdated

    getAsyncSpy.mockResolvedValue({ body: bucketing, status: 200, headers: { 'last-modified': lastModified.toString() } })

    await bucketingSdkManager.initSdk()
    await sleep(800)
    expect(getAsyncSpy.mock.calls.length).toBeGreaterThan(1)
    expect(bucketingSdkManager.getBucketingContent()).toEqual(bucketing)
    expect(onBucketingUpdated).toBeCalledTimes(1)

    bucketingSdkManager.resetSdk()

    expect(bucketingSdkManager.getBucketingContent()).toBeUndefined()

    expect(trackingManager).toBeDefined()

    const label: TroubleshootingLabel = TroubleshootingLabel.SDK_BUCKETING_FILE

    expect(trackingManager.initTroubleshootingHit).toEqual(expect.objectContaining({ data: expect.objectContaining({ label }) }))

    sdkConfig.pollingInterval = 0

    getAsyncSpy.mockResolvedValue({ body: null, status: 304, headers: { 'last-modified': lastModified.toString() } })
    await bucketingSdkManager.initSdk()

    expect(debugLogSpy).toBeCalledTimes(3)
  })
})
