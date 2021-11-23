import { expect, it, describe, jest } from '@jest/globals'
import { DecisionApiConfig, DecisionMode } from '../../src/config/index'
import {
  BASE_API_URL,
  DEFAULT_DEDUPLICATION_TIME,
  FlagshipStatus,
  LogLevel,
  REQUEST_TIME_OUT
} from '../../src/enum/index'
import { IHitCacheImplementation } from '../../src/hit/IHitCacheImplementation'
import { FlagshipLogManager, IFlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { IVisitorCacheImplementation } from '../../src/visitor/IVisitorCacheImplementation '

describe('test DecisionApiConfig', () => {
  const config = new DecisionApiConfig()

  it('should ', () => {
    expect(config.apiKey).toBeUndefined()
    expect(config.envId).toBeUndefined()
    expect(config.logLevel).toBe(LogLevel.ALL)
    expect(config.logManager).toBeUndefined()
    expect(config.statusChangedCallback).toBeUndefined()
    expect(config.timeout).toBe(REQUEST_TIME_OUT)
    expect(config.decisionMode).toBe(DecisionMode.DECISION_API)
    expect(config.fetchNow).toBeTruthy()
    expect(config.enableClientCache).toBeTruthy()
    expect(config.initialBucketing).toBeUndefined()
    expect(config.decisionApiUrl).toBe(BASE_API_URL)
    expect(config.activateDeduplicationTime).toBe(DEFAULT_DEDUPLICATION_TIME)
    expect(config.hitDeduplicationTime).toBe(DEFAULT_DEDUPLICATION_TIME)
    expect(config.hitCacheImplementation).toBeUndefined()
    expect(config.visitorCacheImplementation).toBeUndefined()
    expect(config.disableCache).toBeFalsy()
  })

  it('test config constructor', () => {
    const apiKey = 'apiKey'
    const envId = 'envId'
    const logManager = new FlagshipLogManager()
    const statusChang = jest.fn()
    const initialBucketing = {
      panic: true
    }

    const visitorCacheImplementation:IVisitorCacheImplementation = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      cacheVisitor: function (_visitorId: string, _Data: string): void {
        throw new Error('Function not implemented.')
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      lookupVisitor: function (_visitorId: string): string {
        throw new Error('Function not implemented.')
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      flushVisitor: function (_visitorId: string): void {
        throw new Error('Function not implemented.')
      }
    }

    const hitCacheImplementation:IHitCacheImplementation = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      cacheHit: function (_visitorId: string, _data: string): void {
        throw new Error('Function not implemented.')
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      lookupHits: function (_visitorId: string): string {
        throw new Error('Function not implemented.')
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      flushHits: function (_visitorId: string): void {
        throw new Error('Function not implemented.')
      }
    }

    const config = new DecisionApiConfig({
      apiKey,
      envId,
      logLevel: LogLevel.DEBUG,
      timeout: 5,
      logManager,
      statusChangedCallback: statusChang,
      fetchNow: false,
      enableClientCache: false,
      initialBucketing,
      visitorCacheImplementation,
      hitCacheImplementation,
      disableCache: true
    })
    expect(config.apiKey).toBe(apiKey)
    expect(config.envId).toBe(envId)
    expect(config.logLevel).toBe(LogLevel.DEBUG)
    expect(config.logManager).toBe(logManager)
    expect(config.statusChangedCallback).toBe(statusChang)
    expect(config.timeout).toBe(5)
    expect(config.fetchNow).toBeFalsy()
    expect(config.enableClientCache).toBeFalsy()
    expect(config.initialBucketing).toEqual(initialBucketing)
    expect(config.visitorCacheImplementation).toBe(visitorCacheImplementation)
    expect(config.hitCacheImplementation).toBe(hitCacheImplementation)
    expect(config.disableCache).toBeTruthy()
  })

  it('Test envId field ', () => {
    const envId = 'envId'
    config.envId = envId
    expect(config.envId).toBe(envId)
  })

  it('Test apiKey field', () => {
    const apiKey = 'apiKey'
    config.apiKey = apiKey
    expect(config.apiKey).toBe(apiKey)
  })

  it('Test initialBucketing', () => {
    const initialBucketingUpdate = {
      panic: false
    }
    config.initialBucketing = initialBucketingUpdate
    expect(config.initialBucketing).toEqual(initialBucketingUpdate)
  })

  it('Test logLevel', () => {
    config.logLevel = LogLevel.INFO
    expect(config.logLevel).toBe(LogLevel.INFO)
  })

  it('Test logManager', () => {
    const logManager = {} as IFlagshipLogManager
    config.logManager = logManager
    expect(config.logManager).toBe(logManager)
  })

  it('Test decisionApiUrl log Error', () => {
    const url = {} as string
    config.decisionApiUrl = url
    expect(config.decisionApiUrl).toBe(BASE_API_URL)
  })

  it('Test decisionApiUrl', () => {
    const url = 'https://decision.flagship.io/v2/?l=4'
    config.decisionApiUrl = url
    expect(config.decisionApiUrl).toBe(url)
  })

  it('Test deDuplicationTime', () => {
    config.activateDeduplicationTime = {} as number
    expect(config.activateDeduplicationTime).toBe(DEFAULT_DEDUPLICATION_TIME)
    const activateDeduplicationTime = 3
    config.activateDeduplicationTime = activateDeduplicationTime
    expect(config.activateDeduplicationTime).toBe(activateDeduplicationTime)
  })

  it('Test deDuplicationTime', () => {
    config.hitDeduplicationTime = {} as number
    expect(config.hitDeduplicationTime).toBe(DEFAULT_DEDUPLICATION_TIME)
    const hitDeduplicationTime = 3
    config.hitDeduplicationTime = hitDeduplicationTime
    expect(config.hitDeduplicationTime).toBe(hitDeduplicationTime)
  })

  it('test statusChangedCallback', () => {
    const func = {} as (status: FlagshipStatus) => void
    config.statusChangedCallback = func
    expect(config.statusChangedCallback).toBeUndefined()

    const func2 = () => {
      //
    }
    config.statusChangedCallback = func2

    expect(config.statusChangedCallback).toBe(func2)

    config.timeout = 3000
    expect(config.timeout).toBe(3000)
  })
})
