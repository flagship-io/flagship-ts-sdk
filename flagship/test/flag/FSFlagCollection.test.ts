import { FSFlagCollection } from '../../src/flag/FSFlagCollection'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { FSFlag } from '../../src/flag/FsFlags'
import { expect, it, describe, jest } from '@jest/globals'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig'
import { HttpClient, IHttpResponse } from '../../src/utils/HttpClient'
import { ApiManager } from '../../src/decision/ApiManager'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config/ConfigManager'
import { FSSdkStatus } from '../../src/enum/FSSdkStatus'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'
import { FlagDTO } from '../../src'

describe('FSFlagCollection', () => {
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

  const visitorDelegate = new VisitorDelegate({ hasConsented: true, visitorId, context, configManager })

  const flag1 = new FSFlag({ key: 'flag1', visitor: visitorDelegate })
  const flag2 = new FSFlag({ key: 'flag2', visitor: visitorDelegate })
  const flag3 = new FSFlag({ key: 'flag3', visitor: visitorDelegate })

  const flagsDto = new Map<string, FlagDTO>()
  flagsDto.set('flag1', {
    key: 'flag1',
    campaignId: 'campaignId1',
    campaignName: 'campaignName1',
    variationGroupId: 'variationGroupId1',
    variationGroupName: 'variationGroupName1',
    variationId: 'variationId1',
    variationName: 'variationName1',
    isReference: true,
    value: 'value1',
    slug: 'slug1',
    campaignType: 'ab'
  })

  flagsDto.set('flag2', {
    key: 'flag2',
    campaignId: 'campaignId2',
    campaignName: 'campaignName2',
    variationGroupId: 'variationGroupId2',
    variationGroupName: 'variationGroupName2',
    variationId: 'variationId2',
    variationName: 'variationName2',
    isReference: true,
    value: 'value2',
    slug: 'slug2',
    campaignType: 'ab'
  })

  flagsDto.set('flag3', {
    key: 'flag3',
    campaignId: 'campaignId3',
    campaignName: 'campaignName3',
    variationGroupId: 'variationGroupId3',
    variationGroupName: 'variationGroupName3',
    variationId: 'variationId3',
    variationName: 'variationName3',
    isReference: true,
    value: 'value3',
    slug: 'slug3',
    campaignType: 'ab'
  })

  visitorDelegate.flagsData = flagsDto

  const flagCollection = new FSFlagCollection({ visitor: visitorDelegate })

  describe('constructor', () => {
    it('should initialize the flag collection with the provided flags', () => {
      expect(flagCollection.size).toBe(3)
      expect(flagCollection.get('flag1')).toEqual(flag1)
      expect(flagCollection.get('flag2')).toEqual(flag2)
      expect(flagCollection.get('flag3')).toEqual(flag3)
    })
  })

  describe('get', () => {
    it('should return the flag with the specified key', () => {
      expect(flagCollection.get('flag1')).toEqual(flag1)
    })

    it('should return a new FSFlag instance if the flag does not exist', () => {
      const logWarningSpy = jest.spyOn(logManager, 'warning')
      const nonExistentFlag = flagCollection.get('nonExistentFlag')
      expect(nonExistentFlag).toBeInstanceOf(FSFlag)
      expect(nonExistentFlag.exists()).toBeFalsy()
      expect(nonExistentFlag.getValue('defaultValue')).toBe('defaultValue')
      expect(logWarningSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('has', () => {
    it('should return true if the flag with the specified key exists', () => {
      expect(flagCollection.has('flag1')).toBe(true)
    })

    it('should return false if the flag with the specified key does not exist', () => {
      expect(flagCollection.has('nonExistentFlag')).toBe(false)
    })
  })

  describe('keys', () => {
    it('should return a set of all the flag keys', () => {
      const keys = flagCollection.keys()
      expect(keys).toBeInstanceOf(Set)
      expect(keys.size).toBe(3)
      expect(keys.has('flag1')).toBe(true)
      expect(keys.has('flag2')).toBe(true)
      expect(keys.has('flag3')).toBe(true)
    })
  })

  describe('filter', () => {
    it('should return a new FSFlagCollection with flags that satisfy the predicate', () => {
      const filteredCollection = flagCollection.filter((flag, key) => key !== 'flag1')
      expect(filteredCollection.size).toBe(2)
      expect(filteredCollection.has('flag1')).toBe(false)
      expect(filteredCollection.has('flag2')).toBe(true)
      expect(filteredCollection.has('flag3')).toBe(true)

      const filteredCollection2 = flagCollection.filter((flag, key) => key === 'flag1')
      expect(filteredCollection2.size).toBe(1)
      expect(filteredCollection2.has('flag1')).toBe(true)
      expect(filteredCollection2.has('flag2')).toBe(false)
      expect(filteredCollection2.has('flag3')).toBe(false)
    })
  })

  describe('exposeAll', () => {
    it('should call visitorExposed on all flags', async () => {
      const visitorExposedSpy1 = jest.spyOn(visitorDelegate, 'visitorExposed')

      await flagCollection.exposeAll()

      expect(visitorExposedSpy1).toHaveBeenCalledTimes(3)
      expect(visitorExposedSpy1).toHaveBeenNthCalledWith(1, {
        key: 'flag1',
        flag: expect.anything(),
        hasGetValueBeenCalled: false
      })
      expect(visitorExposedSpy1).toHaveBeenNthCalledWith(2, {
        key: 'flag2',
        flag: expect.anything(),
        hasGetValueBeenCalled: false
      })
      expect(visitorExposedSpy1).toHaveBeenNthCalledWith(3, {
        key: 'flag3',
        flag: expect.anything(),
        hasGetValueBeenCalled: false
      })
    })
  })

  describe('getMetadata', () => {
    it('should return a map of flag metadata', () => {
      const metadataMap = flagCollection.getMetadata()
      expect(metadataMap).toBeInstanceOf(Map)
      expect(metadataMap.size).toBe(3)
      expect(metadataMap.get('flag1')).toEqual(flag1.metadata)
      expect(metadataMap.get('flag2')).toEqual(flag2.metadata)
      expect(metadataMap.get('flag3')).toEqual(flag3.metadata)
    })
  })

  describe('toJSON', () => {
    it('should return an array of serialized flag metadata', () => {
      const serializedData = flagCollection.toJSON()
      expect(serializedData).toBeInstanceOf(Array)
      expect(serializedData.length).toBe(3)
      expect(serializedData[0]).toEqual({
        key: 'flag1',
        campaignId: flag1.metadata.campaignId,
        campaignName: flag1.metadata.campaignName,
        variationGroupId: flag1.metadata.variationGroupId,
        variationGroupName: flag1.metadata.variationGroupName,
        variationId: flag1.metadata.variationId,
        variationName: flag1.metadata.variationName,
        isReference: flag1.metadata.isReference,
        campaignType: flag1.metadata.campaignType,
        slug: flag1.metadata.slug,
        hex: '7b2276223a2276616c756531227d'
      })
      expect(serializedData[1]).toEqual({
        key: 'flag2',
        campaignId: flag2.metadata.campaignId,
        campaignName: flag2.metadata.campaignName,
        variationGroupId: flag2.metadata.variationGroupId,
        variationGroupName: flag2.metadata.variationGroupName,
        variationId: flag2.metadata.variationId,
        variationName: flag2.metadata.variationName,
        isReference: flag2.metadata.isReference,
        campaignType: flag2.metadata.campaignType,
        slug: flag2.metadata.slug,
        hex: '7b2276223a2276616c756532227d'
      })
      expect(serializedData[2]).toEqual({
        key: 'flag3',
        campaignId: flag3.metadata.campaignId,
        campaignName: flag3.metadata.campaignName,
        variationGroupId: flag3.metadata.variationGroupId,
        variationGroupName: flag3.metadata.variationGroupName,
        variationId: flag3.metadata.variationId,
        variationName: flag3.metadata.variationName,
        isReference: flag3.metadata.isReference,
        campaignType: flag3.metadata.campaignType,
        slug: flag3.metadata.slug,
        hex: '7b2276223a2276616c756533227d'
      })
    })
  })

  describe('forEach', () => {
    it('should call the callback function for each flag', () => {
      const flag1 = flagCollection.get('flag1')
      const flag2 = flagCollection.get('flag2')
      const flag3 = flagCollection.get('flag3')
      const callbackFn = jest.fn()
      flagCollection.forEach(callbackFn)

      expect(callbackFn).toHaveBeenCalledTimes(3)
      expect(callbackFn).toHaveBeenCalledWith(flag1, 'flag1', flagCollection)
      expect(callbackFn).toHaveBeenCalledWith(flag2, 'flag2', flagCollection)
      expect(callbackFn).toHaveBeenCalledWith(flag3, 'flag3', flagCollection)
    })
  })
})
