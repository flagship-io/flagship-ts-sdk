import { expect, it, describe, jest } from '@jest/globals'
import Flagship, { DecisionApiConfig, FlagDTO, FlagshipStatus } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { Flag } from '../../src/flag/Flags'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient, IHttpResponse } from '../../src/utils/HttpClient'
import { VisitorDelegate } from '../../src/visitor'

describe('test Flag', () => {
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

  const getStatus = jest.fn<()=>FlagshipStatus>()

  Flagship.getStatus = getStatus

  const visitorDelegate = new VisitorDelegate({ hasConsented: true, visitorId, context, configManager })

  const visitorExposed = jest.spyOn(visitorDelegate, 'visitorExposed')
  const getFlagValue = jest.spyOn(visitorDelegate, 'getFlagValue')

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

  it('test metadata', () => {
    getStatus.mockReturnValue(FlagshipStatus.READY)
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

  it('test userExposed', () => {
    flag.userExposed()
    expect(visitorExposed).toBeCalledTimes(1)
    expect(visitorExposed).toBeCalledWith({
      key: flagDto.key,
      flag: expect.objectContaining(flagDto),
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
