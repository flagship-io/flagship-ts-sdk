import { expect, it, describe, jest } from '@jest/globals'
import { DecisionApiConfig, FSFetchStatus, FSFlagStatus, FSSdkStatus, FlagDTO } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { FSFlag, FSFlagMetadata } from '../../src/flag'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient, IHttpResponse } from '../../src/utils/HttpClient'
import { VisitorDelegate } from '../../src/visitor'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'
import * as forceVariation from '../../src/flag/forceVariation'
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI'

describe('test Flag', () => {
  beforeEach(() => {
    forceVariationSpy.mockReturnValue(undefined)
  })

  afterAll(() => {
    forceVariationSpy.mockReturnValue(undefined)
  })

  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

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

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>()

  } as unknown as IEmotionAI

  const visitorDelegate = new VisitorDelegate({ hasConsented: true, visitorId, context, configManager, emotionAi })

  const visitorExposed = jest.spyOn(visitorDelegate, 'visitorExposed')
  const getFlagValue = jest.spyOn(visitorDelegate, 'getFlagValue')
  const sendExposedVariationSpy = jest.spyOn(visitorDelegate, 'sendExposedVariation')
  const forceVariationSpy = jest.spyOn(forceVariation, 'forceVariation')

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

  const forcedFlagDto:FlagDTO = {
    key: 'key',
    campaignId: 'campaignID',
    variationGroupId: 'variationGroupID',
    variationId: 'forcedVariationID',
    isReference: true,
    value: 'forcedValue',
    slug: 'campaign-slug',
    campaignType: 'ab',
    campaignName: 'campaignName',
    variationGroupName: 'variationGroupName',
    variationName: 'forcedVariationName'
  }

  visitorDelegate.flagsData.set('key', flagDto)

  const defaultValue = 'defaultValue'
  const flag = new FSFlag({
    key: flagDto.key,
    visitor: visitorDelegate
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
        hasGetValueBeenCalled: false
      })
    })
  })

  describe('getValue', () => {
    it('should return the value of the flag and call getFlagValue with the correct parameters', () => {
      const value = flag.getValue(defaultValue)
      expect(value).toBe(flagDto.value)
      expect(getFlagValue).toBeCalledTimes(1)
      expect(getFlagValue).toBeCalledWith({
        key: flagDto.key,
        defaultValue,
        flag: expect.objectContaining(flagDto),
        visitorExposed: true
      })
    })

    it('should return the value of the flag with userExposed set to false', () => {
      const defaultValue = 'defaultValue'
      const value = flag.getValue(defaultValue, false)
      expect(value).toBe(flagDto.value)
      expect(getFlagValue).toBeCalledTimes(1)
      expect(getFlagValue).toBeCalledWith({
        key: flagDto.key,
        defaultValue,
        flag: expect.objectContaining(flagDto),
        visitorExposed: false
      })
      expect(sendExposedVariationSpy).toBeCalledTimes(1)
      expect(sendExposedVariationSpy).toBeCalledWith(flagDto)
    })

    it('test forced flag exists', () => {
      forceVariationSpy.mockReturnValue(forcedFlagDto)
      expect(flag.exists()).toBeTruthy()
    })

    it('test forced flag metadata', () => {
      forceVariationSpy.mockReturnValue(forcedFlagDto)
      expect(flag.metadata).toEqual({
        campaignId: forcedFlagDto.campaignId,
        variationGroupId: forcedFlagDto.variationGroupId,
        variationId: forcedFlagDto.variationId,
        isReference: true,
        campaignType: forcedFlagDto.campaignType,
        slug: forcedFlagDto.slug,
        campaignName: forcedFlagDto.campaignName,
        variationGroupName: forcedFlagDto.variationGroupName,
        variationName: forcedFlagDto.variationName
      })
    })

    it('test forced flag userExposed', () => {
      forceVariationSpy.mockReturnValue(forcedFlagDto)
      flag.visitorExposed()
      expect(visitorExposed).toBeCalledTimes(1)
      expect(visitorExposed).toBeCalledWith({
        key: forcedFlagDto.key,
        flag: expect.objectContaining(forcedFlagDto),
        defaultValue,
        hasGetValueBeenCalled: true
      })
    })

    it('test forced flag value', () => {
      forceVariationSpy.mockReturnValue(forcedFlagDto)
      const value = flag.getValue('defaultValue')
      expect(value).toBe(forcedFlagDto.value)
      expect(getFlagValue).toBeCalledTimes(1)
      expect(getFlagValue).toBeCalledWith({
        key: forcedFlagDto.key,
        defaultValue,
        flag: expect.objectContaining(forcedFlagDto),
        visitorExposed: true
      })
    })
  })

  describe('getValue with defaultValue set to true', () => {
    it('should return true and call getFlagValue with the correct parameters', () => {
      const flag = new FSFlag({ key: flagDto.key, visitor: visitorDelegate })
      const value = flag.getValue(true, false)
      expect(value).toBe(true)
      expect(getFlagValue).toBeCalledTimes(1)
      expect(getFlagValue).toBeCalledWith({
        key: flagDto.key,
        defaultValue: true,
        flag: expect.objectContaining(flagDto),
        visitorExposed: false
      })
    })
  })

  describe('metadata with undefined flag', () => {
    it('should return the metadata with default values', () => {
      const flag = new FSFlag({ key: 'undefined-key', visitor: visitorDelegate })
      expect(flag.exists()).toBeFalsy()
      expect(flag.metadata).toEqual({
        campaignId: '',
        variationGroupId: '',
        campaignType: '',
        variationId: '',
        slug: null,
        isReference: false,
        campaignName: '',
        variationName: '',
        variationGroupName: ''
      })
    })
  })

  describe('status', () => {
    it('should return FSFlagStatus.NOT_FOUND if the flag is not found', () => {
      const flag = new FSFlag({ key: 'not-found-key', visitor: visitorDelegate })
      expect(flag.status).toBe(FSFlagStatus.NOT_FOUND)
    })

    it('should return FSFlagStatus.FETCH_REQUIRED if the fetch status is FETCH_REQUIRED', () => {
      const flag = new FSFlag({ key: flagDto.key, visitor: visitorDelegate })
      expect(flag.exists()).toBeTruthy()
      visitorDelegate.flagsStatus.status = FSFetchStatus.FETCH_REQUIRED
      expect(flag.status).toBe(FSFlagStatus.FETCH_REQUIRED)
    })

    it('should return FSFlagStatus.FETCH_REQUIRED if the fetch status is FETCHING', () => {
      const flag = new FSFlag({ key: flagDto.key, visitor: visitorDelegate })
      expect(flag.exists()).toBeTruthy()
      visitorDelegate.flagsStatus.status = FSFetchStatus.FETCHING
      expect(flag.status).toBe(FSFlagStatus.FETCH_REQUIRED)
    })

    it('should return FSFlagStatus.PANIC if the fetch status is PANIC', () => {
      const flag = new FSFlag({ key: flagDto.key, visitor: visitorDelegate })
      expect(flag.exists()).toBeTruthy()
      visitorDelegate.flagsStatus.status = FSFetchStatus.PANIC
      expect(flag.status).toBe(FSFlagStatus.PANIC)
    })

    it('should return FSFlagStatus.FETCHED if the fetch status is FETCHED', () => {
      const flag = new FSFlag({ key: flagDto.key, visitor: visitorDelegate })
      expect(flag.exists()).toBeTruthy()
      visitorDelegate.flagsStatus.status = FSFetchStatus.FETCHED
      expect(flag.status).toBe(FSFlagStatus.FETCHED)
    })
  })
})

describe('Flag with undefined visitor', () => {
  const flag = new FSFlag({ key: 'key' })

  describe('exists', () => {
    it('should return false if the visitor is undefined', () => {
      expect(flag.exists()).toBeFalsy()
    })
  })

  describe('metadata', () => {
    it('should return the metadata with default values', () => {
      expect(flag.metadata).toEqual(FSFlagMetadata.Empty())
    })
  })

  describe('status', () => {
    it('should return FSFlagStatus.NOT_FOUND if the visitor is undefined', () => {
      expect(flag.status).toBe(FSFlagStatus.NOT_FOUND)
    })
  })

  describe('getValue', () => {
    it('should return the default value if the visitor is undefined', () => {
      const defaultValue = 'defaultValue'
      const value = flag.getValue(defaultValue)
      expect(value).toBe(defaultValue)
    })
  })

  describe('visitorExposed', () => {
    it('should not call visitorExposed if the visitor is undefined', () => {
      flag.visitorExposed()
    })
  })
})
