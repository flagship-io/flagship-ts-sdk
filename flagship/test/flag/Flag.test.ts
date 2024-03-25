import { expect, it, describe, jest } from '@jest/globals'
import { DecisionApiConfig, FSSdkStatus, FlagDTO } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { Flag } from '../../src/flag/Flags'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient, IHttpResponse } from '../../src/utils/HttpClient'
import { VisitorDelegate } from '../../src/visitor'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'
import { FSFlagStatus } from '../../src/enum/FSFlagStatus'
import { FSFetchStatus } from '../../src/enum/FSFetchStatus'

describe('Flag', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logWarning = jest.spyOn(logManager, 'warning')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  VisitorAbstract.SdkStatus = FSSdkStatus.SDK_INITIALIZED

  const visitorDelegate = new VisitorDelegate({ hasConsented: true, visitorId, context, configManager })

  const visitorExposed = jest.spyOn(visitorDelegate, 'visitorExposed')
  const getFlagValue = jest.spyOn(visitorDelegate, 'getFlagValue')

  const flagDto: FlagDTO = {
    key: 'key',
    campaignId: 'campaignID',
    variationGroupId: 'variationGroupID',
    variationId: 'variationID',
    isReference: true,
    value: 'value',
    slug: 'campaign-slug',
    campaignType: 'ab',
    campaignName: 'campaignName',
    variationGroupName: 'variationGroupName',
    variationName: 'variationName'
  }

  visitorDelegate.flagsData.set('key', flagDto)

  const defaultValue = 'defaultValue'
  const flag = new Flag({
    key: flagDto.key,
    visitor: visitorDelegate,
    defaultValue
  })

  describe('exists', () => {
    it('should return true if the flag exists', () => {
      expect(flag.exists()).toBeTruthy()
    })
  })

  describe('metadata', () => {
    it('should return the metadata of the flag', () => {
      VisitorDelegate.SdkStatus = FSSdkStatus.SDK_INITIALIZED
      expect(flag.metadata).toEqual({
        campaignId: flagDto.campaignId,
        variationGroupId: flagDto.variationGroupId,
        variationId: flagDto.variationId,
        isReference: true,
        campaignType: flagDto.campaignType,
        slug: flagDto.slug,
        campaignName: flagDto.campaignName,
        variationGroupName: flagDto.variationGroupName,
        variationName: flagDto.variationName
      })
    })
  })

  describe('visitorExposed', () => {
    it('should call visitorExposed with the correct parameters', () => {
      flag.visitorExposed()
      expect(visitorExposed).toBeCalledTimes(1)
      expect(visitorExposed).toBeCalledWith({
        key: flagDto.key,
        flag: expect.objectContaining(flagDto),
        defaultValue
      })
    })
  })

  describe('getValue', () => {
    it('should return the value of the flag and call getFlagValue with the correct parameters', () => {
      const value = flag.getValue()
      expect(value).toBe(flagDto.value)
      expect(getFlagValue).toBeCalledTimes(1)
      expect(getFlagValue).toBeCalledWith({
        key: flagDto.key,
        defaultValue,
        flag: expect.objectContaining(flagDto),
        userExposed: true
      })
    })

    it('should return the value of the flag with userExposed set to false', () => {
      const defaultValue = 'defaultValue'
      const value = flag.getValue(false)
      expect(value).toBe(flagDto.value)
      expect(getFlagValue).toBeCalledTimes(1)
      expect(getFlagValue).toBeCalledWith({
        key: flagDto.key,
        defaultValue,
        flag: expect.objectContaining(flagDto),
        userExposed: false
      })
    })
  })

  describe('metadata with different type', () => {
    it('should return the metadata with default values and call logWarning', () => {
      const flag = new Flag({ key: flagDto.key, visitor: visitorDelegate, defaultValue: false })
      expect(flag.exists()).toBeTruthy()
      expect(flag.metadata).toEqual({
        campaignId: '',
        slug: null,
        variationGroupId: '',
        campaignType: '',
        variationId: '',
        isReference: false,
        campaignName: '',
        variationName: '',
        variationGroupName: ''
      })
      expect(logWarning).toBeCalledTimes(1)
    })
  })

  describe('getValue with defaultValue set to true', () => {
    it('should return true and call getFlagValue with the correct parameters', () => {
      const flag = new Flag({ key: flagDto.key, visitor: visitorDelegate, defaultValue: true })
      const value = flag.getValue(false)
      expect(value).toBe(true)
      expect(getFlagValue).toBeCalledTimes(1)
      expect(getFlagValue).toBeCalledWith({
        key: flagDto.key,
        defaultValue: true,
        flag: expect.objectContaining(flagDto),
        userExposed: false
      })
    })
  })

  describe('metadata with undefined flag', () => {
    it('should return the metadata with default values', () => {
      const defaultValue = 'defaultValue'
      const flag = new Flag({ key: 'undefined-key', visitor: visitorDelegate, defaultValue })
      expect(flag.exists()).toBeFalsy()
      expect(flag.metadata).toEqual({
        campaignId: '',
        variationGroupId: '',
        campaignType: '',
        variationId: '',
        isReference: false,
        campaignName: '',
        variationName: '',
        variationGroupName: ''
      })
    })
  })

  describe('status', () => {
    it('should return FSFlagStatus.NOT_FOUND if the flag is not found', () => {
      const flag = new Flag({ key: 'not-found-key', visitor: visitorDelegate, defaultValue: true })
      expect(flag.status).toBe(FSFlagStatus.NOT_FOUND)
    })

    it('should return FSFlagStatus.FETCH_REQUIRED if the fetch status is FETCH_REQUIRED', () => {
      const flag = new Flag({ key: flagDto.key, visitor: visitorDelegate, defaultValue: true })
      expect(flag.exists()).toBeTruthy()
      visitorDelegate.fetchStatus.status = FSFetchStatus.FETCH_REQUIRED
      expect(flag.status).toBe(FSFlagStatus.FETCH_REQUIRED)
    })

    it('should return FSFlagStatus.FETCH_REQUIRED if the fetch status is FETCHING', () => {
      const flag = new Flag({ key: flagDto.key, visitor: visitorDelegate, defaultValue: true })
      expect(flag.exists()).toBeTruthy()
      visitorDelegate.fetchStatus.status = FSFetchStatus.FETCHING
      expect(flag.status).toBe(FSFlagStatus.FETCH_REQUIRED)
    })

    it('should return FSFlagStatus.PANIC if the fetch status is PANIC', () => {
      const flag = new Flag({ key: flagDto.key, visitor: visitorDelegate, defaultValue: true })
      expect(flag.exists()).toBeTruthy()
      visitorDelegate.fetchStatus.status = FSFetchStatus.PANIC
      expect(flag.status).toBe(FSFlagStatus.PANIC)
    })

    it('should return FSFlagStatus.FETCHED if the fetch status is FETCHED', () => {
      const flag = new Flag({ key: flagDto.key, visitor: visitorDelegate, defaultValue: true })
      expect(flag.exists()).toBeTruthy()
      visitorDelegate.fetchStatus.status = FSFetchStatus.FETCHED
      expect(flag.status).toBe(FSFlagStatus.FETCHED)
    })
  })
})
