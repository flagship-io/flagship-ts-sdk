import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { BucketingConfig } from '../../src/config/BucketingConfig'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { BucketingManager } from '../../src/decision/BucketingManager'
import { bucketing } from './bucketing'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { BUCKETING_API_URL, FSSdkStatus, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, SDK_INFO } from '../../src/enum'
import { sprintf, sleep } from '../../src/utils/utils'
import { HttpClient } from '../../src/utils/HttpClient'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { DecisionManager } from '../../src/decision/DecisionManager'
import { TrackingManager } from '../../src/api/TrackingManager'
import { BucketingDTO, CampaignDTO, EAIScore, TroubleshootingLabel } from '../../src'
import { Segment } from '../../src/hit/Segment'
import { ISdkManager } from '../../src/main/ISdkManager'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI'

describe('test BucketingManager', () => {
  const config = new BucketingConfig({ pollingInterval: 0, envId: 'envID', apiKey: 'apiKey' })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()

  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>()

  const sdkManager = {
    getBucketingContent
  } as unknown as ISdkManager

  getBucketingContent.mockReturnValue(undefined)

  const bucketingManager = new BucketingManager({ httpClient, config, murmurHash, sdkManager })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendContext = jest.spyOn(bucketingManager as any, 'sendContext')

  const trackingManager = new TrackingManager(httpClient, config)

  sendContext.mockReturnValue(Promise.resolve())

  const visitorId = 'visitor_1'
  const context = {
    age: 20
  }

  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  bucketingManager.trackingManager = trackingManager

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const visitor = new VisitorDelegate({ hasConsented: true, visitorId, context, configManager: { config, decisionManager: bucketingManager, trackingManager }, emotionAi })

  it('test getCampaignsAsync empty', async () => {
    const campaigns = await bucketingManager.getCampaignsAsync(visitor)
    expect(campaigns).toBeNull()
    expect(sendContext).toBeCalledTimes(0)
  })

  it('test getCampaignsAsync panic mode', async () => {
    getBucketingContent.mockReturnValue({ panic: true })
    sendTroubleshootingHit.mockResolvedValue()
    const campaigns = await bucketingManager.getCampaignsAsync(visitor)
    expect(campaigns).toHaveLength(0)
    expect(bucketingManager.isPanic()).toBeTruthy()
    expect(sendContext).toBeCalledTimes(0)
  })

  it('test getCampaignsAsync campaign empty', async () => {
    getBucketingContent.mockReturnValue({
      campaigns: [{
        variationGroups: []
      } as any]
    } as BucketingDTO)
    const campaigns = await bucketingManager.getCampaignsAsync(visitor)
    expect(campaigns).toHaveLength(0)
    expect(sendContext).toBeCalledTimes(1)
  })

  it('test getCampaignsAsync campaign empty', async () => {
    getBucketingContent.mockReturnValue({} as BucketingDTO)
    const campaigns = await bucketingManager.getCampaignsAsync(visitor)
    expect(campaigns).toBeNull()
    expect(bucketingManager.isPanic()).toBeFalsy()
  })

  it('test getCampaignsAsync campaign', async () => {
    getBucketingContent.mockReturnValue(bucketing)
    const campaigns = await bucketingManager.getCampaignsAsync(
      visitor
    )
    const modifications = bucketingManager.getModifications(campaigns as CampaignDTO[])
    expect(modifications.size).toBe(6)
    expect(bucketingManager.troubleshooting?.startDate.toISOString()).toBe('2023-04-13T09:33:38.049Z')
    expect(bucketingManager.troubleshooting?.endDate.toISOString()).toBe('2023-04-13T10:03:38.049Z')
    expect(bucketingManager.troubleshooting?.traffic).toBe(40)
  })
})

describe('test getCampaignsAsync campaign with thirdPartySegment', () => {
  const config = new BucketingConfig({ pollingInterval: 0, envId: 'envID', apiKey: 'apiKey', fetchThirdPartyData: true })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()

  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>()

  const sdkManager = {
    getBucketingContent
  } as unknown as ISdkManager

  const getAsync = jest.spyOn(httpClient, 'getAsync')

  const bucketingManager = new BucketingManager({ httpClient, config, murmurHash, sdkManager })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendContext = jest.spyOn(bucketingManager as any, 'sendContext')

  const trackingManager = new TrackingManager(httpClient, config)

  sendContext.mockReturnValue(Promise.resolve())

  const visitorId = 'visitor_1'
  const context = {
    age: 20
  }

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  bucketingManager.trackingManager = trackingManager

  const visitor = new VisitorDelegate({
    hasConsented: true,
    visitorId,
    context,
    configManager: { config, decisionManager: bucketingManager, trackingManager },
    emotionAi
  })
  it('test getCampaignsAsync campaign with thirdPartySegment', async () => {
    getBucketingContent.mockReturnValue(bucketing)

    const thirdPartySegment = {
      visitor_id: visitorId,
      segment: 'key',
      value: 'value',
      expiration: 123456,
      partner: 'mixpanel'
    }
    const thirdPartySegment2 = {
      visitor_id: visitorId,
      segment: 'key2',
      value: 'value2',
      expiration: 123456,
      partner: 'segment.com'
    }
    getAsync.mockResolvedValue({ body: [thirdPartySegment, thirdPartySegment2], status: 200 })
    const campaigns = await bucketingManager.getCampaignsAsync(
      visitor
    )
    const segment = {
      [`${thirdPartySegment.partner}::${thirdPartySegment.segment}`]: thirdPartySegment.value,
      [`${thirdPartySegment2.partner}::${thirdPartySegment2.segment}`]: thirdPartySegment2.value
    }
    expect(visitor.context).toMatchObject(segment)
    const modifications = bucketingManager.getModifications(campaigns as CampaignDTO[])
    expect(modifications.size).toBe(7)
    expect(modifications.has('thirdIntegration')).toBeTruthy()
    expect(modifications.get('thirdIntegration')?.value).toEqual('value2')
  })
})
/*
describe('test bucketing polling', () => {
  const config = new BucketingConfig({ envId: 'envID', apiKey: 'apiKey' })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()

  const getAsync = jest.spyOn(httpClient, 'getAsync')

  const bucketingManager = new BucketingManager(httpClient, config, murmurHash)

  const trackingManager = new TrackingManager(httpClient, config)

  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  bucketingManager.trackingManager = trackingManager
  it('should ', async () => {
    sendTroubleshootingHit.mockResolvedValue()
    const lastModified = Date.now()
    config.pollingInterval = 0.5
    config.onBucketingUpdated = (lastUpdate) => {
      expect(lastModified.toString()).toBe(lastUpdate.toString())
    }
    getAsync.mockResolvedValue({ body: bucketing, status: 200, headers: { 'last-modified': lastModified.toString() } })
    await bucketingManager.startPolling()
    await sleep(1000)
    bucketingManager.stopPolling()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((bucketingManager as any)._bucketingContent).toEqual(bucketing)

    expect(sendTroubleshootingHit).toBeCalled()
    const label: TroubleshootingLabel = TroubleshootingLabel.SDK_BUCKETING_FILE
    expect(sendTroubleshootingHit).toBeCalledWith(expect.objectContaining({ label }))
  })

  it('should ', async () => {
    const lastModified = Date.now()
    config.pollingInterval = 0.5
    config.onBucketingUpdated = (lastUpdate) => {
      expect(lastModified.toString()).toBe(lastUpdate.toString())
    }
    getAsync.mockResolvedValue({ body: null, status: 304, headers: { 'last-modified': lastModified.toString() } })
    await bucketingManager.startPolling()
    await sleep(1000)
    bucketingManager.stopPolling()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((bucketingManager as any)._bucketingContent).toEqual(bucketing)
  })
})

describe('test update', () => {
  const onBucketingSuccess = jest.fn()

  const config = new BucketingConfig({ pollingInterval: 0, onBucketingSuccess })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()

  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>()

  const sdkManager = {
    getBucketingContent
  } as unknown as ISdkManager

  const getAsync = jest.spyOn(httpClient, 'getAsync')

  const bucketingManager = new BucketingManager({ httpClient, config, murmurHash, sdkManager })
  const trackingManager = new TrackingManager(httpClient, config)

  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  bucketingManager.trackingManager = trackingManager

  const statusChangedCallback = jest.fn<(status: FSSdkStatus) => void>()

  it('test', async () => {
    getAsync.mockResolvedValue({ body: bucketing, status: 200 })
    sendTroubleshootingHit.mockResolvedValue()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFlagshipStatus = jest.spyOn(bucketingManager as any, 'updateFlagshipStatus')

    bucketingManager.statusChangedCallback(statusChangedCallback)
    bucketingManager.startPolling()
    bucketingManager.startPolling()
    await sleep(500)
    expect(updateFlagshipStatus).toBeCalledTimes(2)
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    expect(statusChangedCallback).toBeCalledTimes(2)
    expect(statusChangedCallback).toHaveBeenNthCalledWith(1, FSSdkStatus.SDK_INITIALIZING)
    expect(statusChangedCallback).toHaveBeenNthCalledWith(2, FSSdkStatus.SDK_INITIALIZED)
    expect(onBucketingSuccess).toBeCalledTimes(1)
    expect(onBucketingSuccess).toBeCalledWith({ status: 200, payload: bucketing })
  })
})

describe('test error', () => {
  const error = new Error('Error')
  const onBucketingFail = (error: Error) => {
    expect(error).toEqual(error)
  }
  const config = new BucketingConfig({ pollingInterval: 0, onBucketingFail })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()

  const getAsync = jest.spyOn(httpClient, 'getAsync')

  const bucketingManager = new BucketingManager(httpClient, config, murmurHash)
  const trackingManager = new TrackingManager(httpClient, config)

  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  bucketingManager.trackingManager = trackingManager

  it('test', async () => {
    getAsync.mockRejectedValue(error)
    sendTroubleshootingHit.mockResolvedValue()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFlagshipStatus = jest.spyOn(bucketingManager as any, 'updateFlagshipStatus')
    let count = 0
    bucketingManager.statusChangedCallback((status) => {
      switch (count) {
        case 0:
          expect(status).toBe(FSSdkStatus.SDK_INITIALIZING)
          break
        case 1:
          expect(status).toBe(FSSdkStatus.SDK_NOT_INITIALIZED)
          break
        default:
          break
      }
      count++
    })

    bucketingManager.startPolling()
    await sleep(500)
    expect(updateFlagshipStatus).toBeCalledTimes(2)
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const troubleshootingLabel:TroubleshootingLabel = TroubleshootingLabel.SDK_BUCKETING_FILE_ERROR
    expect(sendTroubleshootingHit).toBeCalledWith(expect.objectContaining({ label: troubleshootingLabel }))
  })
})
    */

describe('test sendContext', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const config = new BucketingConfig({ pollingInterval: 0, envId: 'envID', apiKey: 'apiKey' })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()
  const logManager = new FlagshipLogManager()

  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>()

  const sdkManager = {
    getBucketingContent
  } as unknown as ISdkManager

  config.logManager = logManager

  const logError = jest.spyOn(logManager, 'error')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bucketingManager = new BucketingManager({ httpClient, config, murmurHash, sdkManager }) as any

  const visitorId = 'visitor_1'
  const context = {
    age: 20
  }

  const trackingManager = new TrackingManager({} as HttpClient, config)

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const visitor = new VisitorDelegate({
    hasConsented: true,
    visitorId,
    context,
    configManager: { config, decisionManager: {} as DecisionManager, trackingManager },
    emotionAi
  })

  const sendHit = jest.spyOn(visitor, 'sendHit')
  it('should send segment hit', () => {
    sendHit.mockResolvedValue()
    const SegmentHit = new Segment({ context: visitor.context, visitorId, anonymousId: visitor.anonymousId as string })
    bucketingManager.sendContext(visitor).then(() => {
      expect(sendHit).toBeCalledTimes(1)
      expect(sendHit).toBeCalledWith(SegmentHit)
    })
  })

  it('should send segment hit once', () => {
    sendHit.mockResolvedValue()
    const SegmentHit = new Segment({ context: visitor.context, visitorId, anonymousId: visitor.anonymousId as string })
    visitor.hasContextBeenUpdated = true
    bucketingManager.sendContext(visitor).then(() => {
      expect(sendHit).toBeCalledTimes(1)
      expect(sendHit).toBeCalledWith(SegmentHit)
    })
    bucketingManager.sendContext(visitor).then(() => {
      expect(sendHit).toBeCalledTimes(1)
      expect(sendHit).toBeCalledWith(SegmentHit)
    })
  })

  it('should handle error when sendContext throws an error during bucketing', async () => {
    const messageError = 'error'
    visitor.hasContextBeenUpdated = true
    sendHit.mockRejectedValue(messageError)
    await bucketingManager.sendContext(visitor)
    expect(sendHit).toBeCalledTimes(1)
    expect(logError).toBeCalledTimes(1)
  })

  it('should not send segment hit it when visitor context is empty', async () => {
    const visitor = new VisitorDelegate({
      hasConsented: true,
      visitorId,
      context: {},
      configManager: { config, decisionManager: {} as DecisionManager, trackingManager },
      emotionAi
    })
    await bucketingManager.sendContext(visitor)
    expect(sendHit).toBeCalledTimes(0)
  })

  it('should not send segment hit when visitor has not consented', () => {
    visitor.hasConsented = false
    sendHit.mockResolvedValue()
    bucketingManager.sendContext(visitor).then(() => {
      expect(sendHit).toBeCalledTimes(0)
    })
    visitor.hasConsented = true
  })
})

describe('test bucketing method', () => {
  const config = new BucketingConfig({ pollingInterval: 0 })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()
  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>()

  const sdkManager = {
    getBucketingContent
  } as unknown as ISdkManager

  const bucketingManager = new BucketingManager({ httpClient, config, murmurHash, sdkManager })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bucketingManagerAny = bucketingManager as any

  const visitorId = '123456'

  const context = {
    age: 20
  }

  const fetchEAIScore = jest.fn<() => Promise<EAIScore|undefined>>()

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>(),
    fetchEAIScore
  } as unknown as IEmotionAI

  fetchEAIScore.mockResolvedValue(undefined)

  const trackingManager = new TrackingManager({} as HttpClient, config)

  const visitor = new VisitorDelegate({
    hasConsented: true,
    visitorId,
    context,
    configManager: { config, decisionManager: bucketingManager, trackingManager },
    emotionAi
  })

  const variations = [
    {
      id: 'c20j8bk3fk9hdphqtd30',
      modifications: {
        type: 'HTML',
        value: {
          my_html: '<div>\n  <p>Original</p>\n</div>'
        }
      },
      allocation: 34,
      reference: true
    },
    {
      id: 'c20j8bk3fk9hdphqtd3g',
      modifications: {
        type: 'HTML',
        value: {
          my_html: '<div>\n  <p>variation 1</p>\n</div>'
        }
      },
      allocation: 33
    },
    {
      id: 'c20j9lgbcahhf2mvhbf0',
      modifications: {
        type: 'HTML',
        value: {
          my_html: '<div>\n  <p>variation 2</p>\n</div>'
        }
      },
      allocation: 33
    }
  ]
  const variationGroups = {
    id: '9273BKSDJtoto',
    variations
  }
  it('test getVariation ', () => {
    const response = bucketingManagerAny.getVariation(variationGroups, visitor)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { allocation, ...variation } = variations[0]
    expect(response).toEqual(variation)
  })

  it('test getVariation reallocation ', () => {
    visitor.visitorCache = {
      version: 1,
      data: {
        visitorId: visitor.visitorId,
        anonymousId: null,
        assignmentsHistory: {
          [variationGroups.id]: variations[0].id
        }
      }
    }
    const localVariation = variationGroups.variations.filter(x => x.id !== 'c20j8bk3fk9hdphqtd30')
    const response = bucketingManagerAny.getVariation({ ...variationGroups, variations: localVariation }, visitor)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    expect(response).toBeNull()
  })

  it('test getVariation visitorCache ', () => {
    visitor.visitorCache = {
      version: 1,
      data: {
        visitorId: visitor.visitorId,
        anonymousId: null,
        assignmentsHistory: {
          [variationGroups.id]: variations[1].id
        }
      }
    }
    const response = bucketingManagerAny.getVariation(variationGroups, visitor)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { allocation, ...variation } = variations[1]
    expect(response).toEqual(variation)
  })

  it('test isMatchTargeting with empty VariationGroupDTO ', () => {
    const checkAndTargeting = jest.spyOn(bucketingManagerAny, 'checkAndTargeting')
    const response = bucketingManagerAny.isMatchTargeting([], visitor)
    expect(response).toBeFalsy()
    expect(checkAndTargeting).toBeCalledTimes(0)
  })
  it('test isMatchTargeting ', () => {
    const checkAndTargeting = jest.spyOn(bucketingManagerAny, 'checkAndTargeting')
    const response = bucketingManagerAny.isMatchTargeting({
      targeting: {
        targetingGroups: [
          {
            targetings: [{
              key: 'age',
              operator: 'EQUALS',
              value: 21
            }]
          }
        ]
      }
    }, visitor)
    expect(response).toBeFalsy()
    expect(checkAndTargeting).toBeCalledTimes(1)
  })

  it('test isMatchTargeting ', () => {
    const checkAndTargeting = jest.spyOn(bucketingManagerAny, 'checkAndTargeting')
    const response = bucketingManagerAny.isMatchTargeting({
      targeting: {
        targetingGroups: [
          {
            targetings: [{
              key: 'age',
              operator: 'EQUALS',
              value: 21
            }]
          },
          {
            targetings: [{
              key: 'fs_all_users',
              operator: 'EQUALS',
              value: ''
            }]
          },
          {
            key: 'fs_users',
            operator: 'EQUALS',
            value: visitorId
          }

        ]
      }
    }, visitor)
    expect(response).toBeTruthy()
    expect(checkAndTargeting).toBeCalledTimes(2)
  })

  it('test checkAndTargeting', () => {
    const response = bucketingManagerAny.checkAndTargeting([], visitor)
    expect(response).toBeFalsy()
  })

  const targetingAllUsers = {
    key: 'fs_all_users',
    operator: 'EQUALS',
    value: ''
  }

  it('test checkAndTargeting fs_all_users', () => {
    const response = bucketingManagerAny.checkAndTargeting([targetingAllUsers], visitor)
    expect(response).toBeTruthy()
  })

  it('test checkAndTargeting fs_users', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingFsUsers = [{
      key: 'fs_users',
      operator: 'STARTS_WITH',
      value: '12'
    }, {
      key: 'fs_users',
      operator: 'ENDS_WITH',
      value: '6'
    }]
    const response = bucketingManagerAny.checkAndTargeting(targetingFsUsers, visitor)
    expect(response).toBeTruthy()
    expect(testOperator).toBeCalledTimes(2)
  })

  it('test checkAndTargeting fs_users targeting and', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingFsUsers = [{
      key: 'fs_users',
      operator: 'STARTS_WITH',
      value: '2'
    }, {
      key: 'fs_users',
      operator: 'ENDS_WITH',
      value: '6'
    }]
    const response = bucketingManagerAny.checkAndTargeting(targetingFsUsers, visitor)
    expect(response).toBeFalsy()
    expect(testOperator).toBeCalledTimes(1)
  })

  it('test checkAndTargeting key EXISTS 1', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingFsUsers = [{
      key: 'partner::key1',
      operator: 'EXISTS',
      value: '2'
    }, {
      key: 'fs_users',
      operator: 'ENDS_WITH',
      value: '6'
    }]
    const response = bucketingManagerAny.checkAndTargeting(targetingFsUsers, visitor)
    expect(response).toBeFalsy()
    expect(testOperator).toBeCalledTimes(0)
  })

  it('test checkAndTargeting key EXISTS 2', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingFsUsers = [{
      key: 'partner::key1',
      operator: 'EXISTS',
      value: false
    }, {
      key: 'fs_users',
      operator: 'ENDS_WITH',
      value: '6'
    }]
    visitor.updateContext({ 'partner::key1': false })
    const response = bucketingManagerAny.checkAndTargeting(targetingFsUsers, visitor)
    expect(response).toBeTruthy()
    expect(testOperator).toBeCalledTimes(1)
  })

  it('test checkAndTargeting key NOT_EXISTS 1', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingFsUsers = [{
      key: 'partner::key2',
      operator: 'NOT_EXISTS',
      value: false
    }, {
      key: 'fs_users',
      operator: 'ENDS_WITH',
      value: '6'
    }]
    // visitor.updateContext({ 'partner::key1': false })
    const response = bucketingManagerAny.checkAndTargeting(targetingFsUsers, visitor)
    expect(response).toBeTruthy()
    expect(testOperator).toBeCalledTimes(1)
  })

  it('test checkAndTargeting key NOT_EXISTS 2', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingFsUsers = [{
      key: 'partner::key2',
      operator: 'NOT_EXISTS',
      value: false
    }, {
      key: 'fs_users',
      operator: 'ENDS_WITH',
      value: '6'
    }]
    visitor.updateContext({ 'partner::key2': false })
    const response = bucketingManagerAny.checkAndTargeting(targetingFsUsers, visitor)
    expect(response).toBeFalsy()
    expect(testOperator).toBeCalledTimes(0)
  })

  it('test checkAndTargeting key not match context', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingKeyContext = {
      key: 'anyKey',
      operator: 'EQUALS',
      value: 'anyValue'
    }
    const response = bucketingManagerAny.checkAndTargeting([targetingKeyContext], visitor)
    expect(response).toBeFalsy()
    expect(testOperator).toBeCalledTimes(0)
  })

  it('test checkAndTargeting key match context', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingKeyContext = {
      key: 'age',
      operator: 'EQUALS',
      value: 20
    }
    const response = bucketingManagerAny.checkAndTargeting([targetingKeyContext], visitor)
    expect(response).toBeTruthy()
    expect(testOperator).toBeCalledTimes(1)
    expect(testOperator).toBeCalledWith(targetingKeyContext.operator, context.age, targetingKeyContext.value)
  })

  it('test checkAndTargeting ', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingKeyContext = {
      key: 'anyValue',
      operator: 'EQUALS',
      value: 21
    }
    const response = bucketingManagerAny.checkAndTargeting([targetingKeyContext, targetingAllUsers], visitor)
    expect(response).toBeFalsy()
    expect(testOperator).toBeCalledTimes(0)
  })

  it('test testOperator EQUALS Test different values', () => {
    const contextValue = 5
    const targetingValue = 6
    const response = bucketingManagerAny.testOperator('EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator EQUALS Test different type', () => {
    const contextValue = 5
    const targetingValue = '5'
    const response = bucketingManagerAny.testOperator('EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator EQUALS Test same type and value', () => {
    const contextValue = 5
    const targetingValue = 5
    const response = bucketingManagerAny.testOperator('EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator NOT_EQUALS Test different values', () => {
    const contextValue = 5
    const targetingValue = 6
    const response = bucketingManagerAny.testOperator('NOT_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator NOT_EQUALS Test different type', () => {
    const contextValue = 5
    const targetingValue = '5'
    const response = bucketingManagerAny.testOperator('NOT_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator NOT_EQUALS Test same type and value', () => {
    const contextValue = 5
    const targetingValue = 5
    const response = bucketingManagerAny.testOperator('NOT_EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator CONTAINS Test contextValue not contains targetingValue', () => {
    const contextValue = 'a'
    const targetingValue = 'b'
    const response = bucketingManagerAny.testOperator('CONTAINS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator CONTAINS Test contextValue contains targetingValue', () => {
    const contextValue = 'abc'
    const targetingValue = 'b'
    const response = bucketingManagerAny.testOperator('CONTAINS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator CONTAINS Test contextValue contains targetingValue', () => {
    const contextValue = 'nopq_hij'
    const targetingValue = ['abc', 'dfg', 'hij', 'klm']
    const response = bucketingManagerAny.testOperator('CONTAINS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator NOT_CONTAINS Test contextValue not contains targetingValue', () => {
    const contextValue = 'abc'
    const targetingValue = 'd'
    const response = bucketingManagerAny.testOperator('NOT_CONTAINS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator NOT_CONTAINS Test contextValue contains targetingValue', () => {
    const contextValue = 'abc'
    const targetingValue = 'b'
    const response = bucketingManagerAny.testOperator('NOT_CONTAINS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 5
    const targetingValue = 6
    const response = bucketingManagerAny.testOperator('GREATER_THAN', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 5
    const targetingValue = 5
    const response = bucketingManagerAny.testOperator('GREATER_THAN', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 'a'
    const targetingValue = 'b'
    const response = bucketingManagerAny.testOperator('GREATER_THAN', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 'abz'
    const targetingValue = 'bcg'
    const response = bucketingManagerAny.testOperator('GREATER_THAN', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN Test contextValue GREATER_THAN targetingValue', () => {
    const contextValue = 8
    const targetingValue = 5
    const response = bucketingManagerAny.testOperator('GREATER_THAN', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator GREATER_THAN Test contextValue GREATER_THAN targetingValue', () => {
    const contextValue = '9dlk'
    const targetingValue = '8'
    const response = bucketingManagerAny.testOperator('GREATER_THAN', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator LOWER_THAN Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 5
    const targetingValue = 6
    const response = bucketingManagerAny.testOperator('LOWER_THAN', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator LOWER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 5
    const targetingValue = 5
    const response = bucketingManagerAny.testOperator('LOWER_THAN', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator LOWER_THAN Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 'a'
    const targetingValue = 'b'
    const response = bucketingManagerAny.testOperator('LOWER_THAN', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator LOWER_THAN Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 'abz'
    const targetingValue = 'bcg'
    const response = bucketingManagerAny.testOperator('LOWER_THAN', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator LOWER_THAN Test contextValue not LOWER_THAN targetingValue', () => {
    const contextValue = 8
    const targetingValue = 2
    const response = bucketingManagerAny.testOperator('LOWER_THAN', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN_OR_EQUALS Test contextValue GREATER_THAN targetingValue', () => {
    const contextValue = 8
    const targetingValue = 2
    const response = bucketingManagerAny.testOperator('GREATER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator GREATER_THAN_OR_EQUALS Test contextValue EQUALS targetingValue', () => {
    const contextValue = 8
    const targetingValue = 8
    const response = bucketingManagerAny.testOperator('GREATER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator GREATER_THAN_OR_EQUALS Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 7
    const targetingValue = 8
    const response = bucketingManagerAny.testOperator('GREATER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN_OR_EQUALS Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 'a'
    const targetingValue = 'b'
    const response = bucketingManagerAny.testOperator('GREATER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator LOWER_THAN_OR_EQUALS Test contextValue GREATER_THAN targetingValue', () => {
    const contextValue = 8
    const targetingValue = 6
    const response = bucketingManagerAny.testOperator('LOWER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator LOWER_THAN_OR_EQUALS Test contextValue EQUALS targetingValue', () => {
    const contextValue = 8
    const targetingValue = 8
    const response = bucketingManagerAny.testOperator('LOWER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator LOWER_THAN_OR_EQUALS Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 7
    const targetingValue = 8
    const response = bucketingManagerAny.testOperator('LOWER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator LOWER_THAN_OR_EQUALS Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 'a'
    const targetingValue = 'b'
    const response = bucketingManagerAny.testOperator('LOWER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator STARTS_WITH Test contextValue STARTS_WITH targetingValue', () => {
    const contextValue = 'abcd'
    const targetingValue = 'ab'
    const response = bucketingManagerAny.testOperator('STARTS_WITH', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator STARTS_WITH Test contextValue STARTS_WITH targetingValue', () => {
    const contextValue = 'abcd'
    const targetingValue = 'AB'
    const response = bucketingManagerAny.testOperator('STARTS_WITH', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator STARTS_WITH Test contextValue STARTS_WITH targetingValue', () => {
    const contextValue = 'abcd'
    const targetingValue = 'ac'
    const response = bucketingManagerAny.testOperator('STARTS_WITH', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator ENDS_WITH Test contextValue ENDS_WITH targetingValue', () => {
    const contextValue = 'abcd'
    const targetingValue = 'cd'
    const response = bucketingManagerAny.testOperator('ENDS_WITH', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator ENDS_WITH Test contextValue ENDS_WITH targetingValue', () => {
    const contextValue = 'abcd'
    const targetingValue = 'CD'
    const response = bucketingManagerAny.testOperator('ENDS_WITH', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator ENDS_WITH Test contextValue ENDS_WITH targetingValue', () => {
    const contextValue = 'abcd'
    const targetingValue = 'bd'
    const response = bucketingManagerAny.testOperator('ENDS_WITH', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator CONTAINS Test contextValue CONTAINS targetingValue list', () => {
    const contextValue = 'abcd'
    const targetingValue = ['a', 'e']
    const response = bucketingManagerAny.testOperator('CONTAINS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator EQUALS Test contextValue EQUALS targetingValue list', () => {
    const contextValue = 'a'
    const targetingValue = ['a', 'b', 'c']
    const response = bucketingManagerAny.testOperator('EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator CONTAINS Test contextValue not CONTAINS targetingValue list', () => {
    const contextValue = 'abcd'
    const targetingValue = ['e', 'f']
    const response = bucketingManagerAny.testOperator('CONTAINS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator EQUALS Test contextValue EQUALS targetingValue list', () => {
    const contextValue = 'a'
    const targetingValue = ['b', 'c', 'd']
    const response = bucketingManagerAny.testOperator('EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator NOT_CONTAINS Test contextValue NOT_CONTAINS targetingValue list', () => {
    const contextValue = 'abcd'
    const targetingValue = ['e', 'f']
    const response = bucketingManagerAny.testOperator('NOT_CONTAINS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator NOT_EQUALS Test contextValue NOT_EQUALS targetingValue list', () => {
    const contextValue = 'a'
    const targetingValue = ['b', 'c', 'd']
    const response = bucketingManagerAny.testOperator('NOT_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator NOT_CONTAINS Test contextValue not NOT_CONTAINS targetingValue list', () => {
    const contextValue = 'abcd'
    const targetingValue = ['a', 'e']
    const response = bucketingManagerAny.testOperator('NOT_CONTAINS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator NOT_EQUALS Test contextValue NOT_EQUALS targetingValue list', () => {
    const contextValue = 'a'
    const targetingValue = ['a', 'b', 'c']
    const response = bucketingManagerAny.testOperator('NOT_EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator NotEXIST', () => {
    const contextValue = 'abcd'
    const targetingValue = 'bd'
    const response = bucketingManagerAny.testOperator('NotEXIST', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })
})
/*
describe('test initBucketing', () => {
  const config = new BucketingConfig({ pollingInterval: 0, initialBucketing: bucketing })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()

  const getAsync = jest.spyOn(httpClient, 'getAsync')

  const bucketingManager = new BucketingManager(httpClient, config, murmurHash)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendContext = jest.spyOn(bucketingManager as any, 'sendContext')

  sendContext.mockReturnValue(Promise.resolve())

  const visitorId = 'visitor_1'
  const context = {
    age: 20
  }
  it('should ', async () => {
    const trackingManager = new TrackingManager({} as HttpClient, config)

    const visitor = new VisitorDelegate({ hasConsented: true, visitorId, context, configManager: { config, decisionManager: bucketingManager, trackingManager } })
    const campaigns = await bucketingManager.getCampaignsAsync(visitor)
    const modifications = bucketingManager.getModifications(campaigns as CampaignDTO[])
    expect(modifications.size).toBe(6)
    expect(getAsync).toBeCalledTimes(0)
  })
})
*/
describe('test getThirdPartySegment', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })

  const config = new BucketingConfig({ pollingInterval: 0, envId: 'envID', apiKey: 'apiKey' })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()
  const logManager = new FlagshipLogManager()

  config.logManager = logManager

  const logError = jest.spyOn(logManager, 'error')

  const getBucketingContent = jest.fn<() => BucketingDTO | undefined>()

  const sdkManager = {
    getBucketingContent
  } as unknown as ISdkManager

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bucketingManager = new BucketingManager({ httpClient, config, murmurHash, sdkManager })

  const trackingManager = new TrackingManager(httpClient, config)
  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  bucketingManager.trackingManager = trackingManager

  const visitorId = 'visitor_1'

  const getAsync = jest.spyOn(httpClient, 'getAsync')

  const thirdPartySegment = {
    visitor_id: visitorId,
    segment: 'key',
    value: 'value',
    expiration: 123456,
    partner: 'mixpanel'
  }
  const thirdPartySegment2 = {
    visitor_id: visitorId,
    segment: 'key2',
    value: 'value2',
    expiration: 123456,
    partner: 'segment.com'
  }
  it('test getThirdPartySegment method', async () => {
    getAsync.mockResolvedValue({
      status: 200,
      body: [thirdPartySegment, thirdPartySegment2]
    })
    sendTroubleshootingHit.mockResolvedValue()
    const segments = await bucketingManager.getThirdPartySegment(visitorId)

    expect(segments[`${thirdPartySegment.partner}::${thirdPartySegment.segment}`]).toEqual(thirdPartySegment.value)
    expect(segments[`${thirdPartySegment2.partner}::${thirdPartySegment2.segment}`]).toEqual(thirdPartySegment2.value)
  })

  it('test getThirdPartySegment error', async () => {
    const messageError = 'error'
    getAsync.mockRejectedValue({
      status: 403,
      body: messageError
    })
    const segments = await bucketingManager.getThirdPartySegment(visitorId)
    expect(logError).toBeCalledTimes(1)
    expect(segments).toEqual({})
  })
})
