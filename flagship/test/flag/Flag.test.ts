import { expect, it, describe, jest } from '@jest/globals'
import Flagship, { DecisionApiConfig, FlagDTO, FlagshipStatus } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { Flag } from '../../src/flag/Flags'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient, IHttpOptions, IHttpResponse } from '../../src/utils/HttpClient'
import { VisitorDelegate } from '../../src/visitor'
import { Mock } from 'jest-mock'

describe('test Flag', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post: Mock<
  Promise<IHttpResponse>,
  [url: string, options: IHttpOptions]
> = jest.fn()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const getStatus:Mock<FlagshipStatus, []> = jest.fn()

  Flagship.getStatus = getStatus

  const visitorDelegate = new VisitorDelegate({ hasConsented: true, visitorId, context, configManager: configManager })

  const userExposed = jest.spyOn(visitorDelegate, 'userExposed')
  const getFlagValue = jest.spyOn(visitorDelegate, 'getFlagValue')

  const flagDto:FlagDTO = {
    key: 'key',
    campaignId: 'campaignID',
    variationGroupId: 'variationGroupID',
    variationId: 'variationID',
    isReference: true,
    value: 'value'
  }
  const defaultValue = 'defaultValue'
  const flag = new Flag({
    key: flagDto.key,
    visitor: visitorDelegate,
    flagDTO: flagDto,
    defaultValue
  })
  it('test exists', () => {
    expect(flag.exists()).toBeTruthy()
  })

  it('test metadata', () => {
    getStatus.mockReturnValue(FlagshipStatus.READY)
    expect(flag.metadata).toEqual({
      campaignId: 'campaignID',
      variationGroupId: 'variationGroupID',
      variationId: 'variationID',
      isReference: true,
      campaignType: ''
    })
  })

  it('test userExposed', () => {
    flag.userExposed()
    expect(userExposed).toBeCalledTimes(1)
    expect(userExposed).toBeCalledWith({
      key: flagDto.key,
      flag: expect.objectContaining(flagDto),
      defaultValue
    })
  })

  it('test value', () => {
    const value = flag.value()
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
    const value = flag.value(false)
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
    const flag = new Flag({ key: flagDto.key, flagDTO: flagDto, visitor: visitorDelegate, defaultValue: false })
    expect(flag.exists()).toBeFalsy()
    expect(flag.metadata).toEqual(
      {
        campaignId: '',
        variationGroupId: '',
        campaignType: '',
        variationId: '',
        isReference: false
      })
    expect(logError).toBeCalledTimes(1)
  })

  it('test metadata with undefined flag ', () => {
    const defaultValue = 'defaultValue'
    const flag = new Flag({ key: flagDto.key, visitor: visitorDelegate, defaultValue })
    expect(flag.exists()).toBeFalsy()
    expect(flag.metadata).toEqual(
      {
        campaignId: '',
        variationGroupId: '',
        campaignType: '',
        variationId: '',
        isReference: false
      })
  })

  it('should ', () => {
    const flag = new Flag({ key: flagDto.key, visitor: visitorDelegate, flagDTO: flagDto, defaultValue: true })
    const value = flag.value(false)
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
