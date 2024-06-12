import { expect, it, describe, jest, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { IHitCacheImplementation, IVisitorCacheImplementation } from '../../src'
import { DecisionApiConfig, DecisionMode } from '../../src/config/index'
import { TrackingManagerConfig } from '../../src/config/TrackingManagerConfig'
import {
  BASE_API_URL,
  DEFAULT_DEDUPLICATION_TIME,
  FSSdkStatus,
  LogLevel,
  REQUEST_TIME_OUT,
  SDK_INFO
} from '../../src/enum/index'
import { version } from '../../src/sdkVersion'
import { HitCacheDTO, VisitorCacheDTO } from '../../src/types'
import { FlagshipLogManager, IFlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import * as utils from '../../src/utils/utils'
describe('test DecisionApiConfig', () => {
  const config = new DecisionApiConfig()
  const nextFetchConfig = {
    revalidate: 20
  }
  it('should ', () => {
    expect(config.apiKey).toBeUndefined()
    expect(config.envId).toBeUndefined()
    expect(config.logLevel).toBe(LogLevel.ALL)
    expect(config.logManager).toBeUndefined()
    expect(config.onSdkStatusChanged).toBeUndefined()
    expect(config.timeout).toBe(REQUEST_TIME_OUT)
    expect(config.decisionMode).toBe(DecisionMode.DECISION_API)
    expect(config.fetchNow).toBeTruthy()
    expect(config.reuseVisitorIds).toBeTruthy()
    expect(config.initialBucketing).toBeUndefined()
    expect(config.decisionApiUrl).toBe(BASE_API_URL)
    expect(config.hitDeduplicationTime).toBe(DEFAULT_DEDUPLICATION_TIME)
    expect(config.hitCacheImplementation).toBeUndefined()
    expect(config.visitorCacheImplementation).toBeUndefined()
    expect(config.disableCache).toBeFalsy()
    expect(config.trackingManagerConfig).toBeInstanceOf(TrackingManagerConfig)
    expect(config.onLog).toBeUndefined()
    expect(config.onVisitorExposed).toBeUndefined()
    expect(config.nextFetchConfig).toEqual(nextFetchConfig)
    expect(config.fetchThirdPartyData).toBeFalsy()
  })

  it('test config constructor', () => {
    const apiKey = 'apiKey'
    const envId = 'envId'
    const logManager = new FlagshipLogManager()
    const statusChang = jest.fn()
    const initialBucketing = {
      panic: true
    }

    const visitorCacheImplementation: IVisitorCacheImplementation = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      cacheVisitor: function (_visitorId: string, _Data: VisitorCacheDTO):Promise<void> {
        throw new Error('Function not implemented.')
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      lookupVisitor: function (_visitorId: string): Promise<VisitorCacheDTO> {
        throw new Error('Function not implemented.')
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      flushVisitor: function (_visitorId: string): Promise<void> {
        throw new Error('Function not implemented.')
      }
    }

    const hitCacheImplementation: IHitCacheImplementation = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      cacheHit: function (hits: Record<string, HitCacheDTO>): Promise<void> {
        throw new Error('Function not implemented.')
      },
      lookupHits: function (): Promise<Record<string, HitCacheDTO>> {
        throw new Error('Function not implemented.')
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      flushHits: function (hitKeys: string[]): Promise<void> {
        throw new Error('Function not implemented.')
      },
      flushAllHits: function (): Promise<void> {
        throw new Error('Function not implemented.')
      }
    }

    const onVisitorExposed = jest.fn()

    const onLog = jest.fn()

    const config = new DecisionApiConfig({
      apiKey,
      envId,
      logLevel: LogLevel.DEBUG,
      timeout: 5,
      logManager,
      onSdkStatusChanged: statusChang,
      fetchNow: false,
      reuseVisitorIds: false,
      initialBucketing,
      visitorCacheImplementation,
      hitCacheImplementation,
      disableCache: true,
      hitDeduplicationTime: 20,
      onLog,
      onVisitorExposed
    })

    expect(config.apiKey).toBe(apiKey)
    expect(config.envId).toBe(envId)
    expect(config.logLevel).toBe(LogLevel.DEBUG)
    expect(config.logManager).toBe(logManager)
    expect(config.onSdkStatusChanged).toBe(statusChang)
    expect(config.timeout).toBe(5)
    expect(config.fetchNow).toBeFalsy()
    expect(config.reuseVisitorIds).toBeFalsy()
    expect(config.initialBucketing).toEqual(initialBucketing)
    expect(config.visitorCacheImplementation).toBe(visitorCacheImplementation)
    expect(config.hitCacheImplementation).toBe(hitCacheImplementation)
    expect(config.disableCache).toBeTruthy()
    expect(config.hitDeduplicationTime).toBe(20)
    expect(config.onVisitorExposed).toBe(onVisitorExposed)
    expect(config.onLog).toBe(onLog)
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
    config.hitDeduplicationTime = {} as number
    expect(config.hitDeduplicationTime).toBe(DEFAULT_DEDUPLICATION_TIME)
    const hitDeduplicationTime = 3
    config.hitDeduplicationTime = hitDeduplicationTime
    expect(config.hitDeduplicationTime).toBe(hitDeduplicationTime)
  })

  it('test statusChangedCallback', () => {
    const func = {} as (status: FSSdkStatus) => void
    config.onSdkStatusChanged = func
    expect(config.onSdkStatusChanged).toBeUndefined()

    const func2 = () => {
      //
    }
    config.onSdkStatusChanged = func2

    expect(config.onSdkStatusChanged).toBe(func2)

    config.timeout = 3000
    expect(config.timeout).toBe(3000)
  })
})

describe('Test SDK_LANGUAGE', () => {
  it('should be reactJS', () => {
    const sdkVersion = '2.12.5'
    const config = new DecisionApiConfig({ language: 1, sdkVersion })
    expect(SDK_INFO.name).toBe('ReactJS')
    expect(SDK_INFO.version).toBe(sdkVersion)
    expect(config.decisionMode).toBe(DecisionMode.DECISION_API)
  })
  it('should be react-native', () => {
    const sdkVersion = '2.5.5'
    const config = new DecisionApiConfig({ language: 2, sdkVersion })
    expect(SDK_INFO.name).toBe('React-Native')
    expect(SDK_INFO.version).toBe(sdkVersion)
    expect(config.decisionMode).toBe(DecisionMode.DECISION_API)
  })

  it('should be Typescript', () => {
    const sdkVersion = '2.6.5'
    const config = new DecisionApiConfig({ language: 0, sdkVersion })
    expect(SDK_INFO.name).toBe('TypeScript')
    expect(SDK_INFO.version).toBe(version)
    expect(config.decisionMode).toBe(DecisionMode.DECISION_API)
  })

  it('should be Deno', () => {
    const window = globalThis.window

    globalThis.window = {
      Deno: expect.anything()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const config = new DecisionApiConfig({ language: 0 })
    expect(SDK_INFO.name).toBe('Deno')
    expect(config.decisionMode).toBe(DecisionMode.DECISION_API)
    global.window = window
  })
})

describe('test initQaMode', () => {
  beforeAll(() => {
    global.sessionStorage = storageMock
  })

  afterAll(() => {
    isBrowserSpy.mockReturnValue(false)
  })

  beforeEach(() => {
    isBrowserSpy.mockReturnValue(false)
  })

  const isBrowserSpy = jest.spyOn(utils, 'isBrowser')

  const storageMock = {
    getItem: jest.fn<(key: string)=>string|null>(),
    setItem: jest.fn<(key: string, value: string)=> void>(),
    clear: jest.fn(),
    removeItem: jest.fn<(key: string)=>void>(),
    key: jest.fn<(key: number)=>string>(),
    length: 0
  }
  it('test environment is not browser', () => {
    expect(storageMock.getItem).toBeCalledTimes(0)
    const config = new DecisionApiConfig()
    expect(config.isQAModeEnabled).toBeFalsy()
  })
  it('test environment is browser and session storage is null', () => {
    isBrowserSpy.mockReturnValue(true)
    storageMock.getItem.mockReturnValue(null)
    const config = new DecisionApiConfig()
    expect(storageMock.getItem).toBeCalledTimes(1)
    expect(config.isQAModeEnabled).toBeFalsy()
  })

  it('test environment is browser and session storage is true', () => {
    isBrowserSpy.mockReturnValue(true)
    storageMock.getItem.mockReturnValue('true')
    const config = new DecisionApiConfig()
    expect(storageMock.getItem).toBeCalledTimes(1)
    expect(config.isQAModeEnabled).toBeTruthy()
  })

  it('test environment is browser and session storage is false', () => {
    isBrowserSpy.mockReturnValue(true)
    storageMock.getItem.mockReturnValue('false')
    const config = new DecisionApiConfig()
    expect(storageMock.getItem).toBeCalledTimes(1)
    expect(config.isQAModeEnabled).toBeFalsy()
  })

  it('test environment is browser and throw error', () => {
    isBrowserSpy.mockReturnValue(true)
    storageMock.getItem.mockImplementation(() => {
      throw new Error()
    })
    const config = new DecisionApiConfig()
    expect(storageMock.getItem).toBeCalledTimes(1)
    expect(config.isQAModeEnabled).toBeFalsy()
  })
})
