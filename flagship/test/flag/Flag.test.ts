import { expect, it, describe, jest, beforeEach, afterAll } from '@jest/globals'
import { DecisionApiConfig, FlagDTO, FlagshipStatus } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { Flag } from '../../src/flag/Flags'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient, IHttpResponse } from '../../src/utils/HttpClient'
import { VisitorDelegate } from '../../src/visitor'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'
import * as forceVariation from '../../src/flag/forceVariation'

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

  VisitorAbstract.SdkStatus = FlagshipStatus.READY

  const visitorDelegate = new VisitorDelegate({ hasConsented: true, visitorId, context, configManager })

  const visitorExposed = jest.spyOn(visitorDelegate, 'visitorExposed')
  const getFlagValue = jest.spyOn(visitorDelegate, 'getFlagValue')
  const forceVariationSpy = jest.spyOn(forceVariation, 'forceVariation')

  const flagDto:FlagDTO = {
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
  const flag = new Flag({
    key: flagDto.key,
    visitor: visitorDelegate,
    defaultValue
  })
  it('test exists', () => {
    expect(flag.exists()).toBeTruthy()
  })

  it('test forced flag exists', () => {
    forceVariationSpy.mockReturnValue(forcedFlagDto)
    expect(flag.exists()).toBeTruthy()
  })

  it('test metadata', () => {
    VisitorDelegate.SdkStatus = FlagshipStatus.READY
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

  it('test forced flag metadata', () => {
    forceVariationSpy.mockReturnValue(forcedFlagDto)
    VisitorDelegate.SdkStatus = FlagshipStatus.READY
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

  it('test userExposed', () => {
    flag.userExposed()
    expect(visitorExposed).toBeCalledTimes(1)
    expect(visitorExposed).toBeCalledWith({
      key: flagDto.key,
      flag: expect.objectContaining(flagDto),
      defaultValue
    })
  })

  it('test forced flag userExposed', () => {
    forceVariationSpy.mockReturnValue(forcedFlagDto)
    flag.userExposed()
    expect(visitorExposed).toBeCalledTimes(1)
    expect(visitorExposed).toBeCalledWith({
      key: forcedFlagDto.key,
      flag: expect.objectContaining(forcedFlagDto),
      defaultValue
    })
  })

  it('test value', () => {
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

  it('test forced flag value', () => {
    forceVariationSpy.mockReturnValue(forcedFlagDto)
    const value = flag.getValue()
    expect(value).toBe(forcedFlagDto.value)
    expect(getFlagValue).toBeCalledTimes(1)
    expect(getFlagValue).toBeCalledWith({
      key: forcedFlagDto.key,
      defaultValue,
      flag: expect.objectContaining(forcedFlagDto),
      userExposed: true
    })
  })

  it('test value', () => {
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

  it('test metadata with different type ', () => {
    const flag = new Flag({ key: flagDto.key, visitor: visitorDelegate, defaultValue: false })
    expect(flag.exists()).toBeTruthy()
    expect(flag.metadata).toEqual(
      {
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

  it('should ', () => {
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

  it('test metadata with undefined flag ', () => {
    const defaultValue = 'defaultValue'
    visitorDelegate.flagsData.clear()
    const flag = new Flag({ key: flagDto.key, visitor: visitorDelegate, defaultValue })
    expect(flag.exists()).toBeFalsy()
    expect(flag.metadata).toEqual(
      {
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
