import { returnFlag } from './modification'
import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig, EventCategory } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { HitType } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient, IHttpResponse } from '../../src/utils/HttpClient'
import { VisitorDelegate, DefaultStrategy } from '../../src/visitor'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { sleep } from '../../src/utils/utils'

describe('Visitor DeDuplication', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')

  addHit.mockResolvedValue()
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
  const murmurHash = new MurmurHash()
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test visitorExposed', async () => {
    const flag = {
      key: 'keyNull',
      campaignId: 'c2nrh1hjg50l9thhu8bg',
      variationGroupId: 'c2nrh1hjg50lf9thhu8cgkeyNull',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName',
      isReference: false,
      value: null
    }
    const flag2 = {
      key: 'keyNumber2',
      campaignId: 'c2nrh1hjg50l9thhu8bg',
      variationGroupId: 'c2nrh1hjg50l9thhu8cgKeyNumber2',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName',
      isReference: false,
      value: null
    }
    await defaultStrategy.visitorExposed({ key: flag.key, flag, defaultValue: flag.value })
    await defaultStrategy.visitorExposed({ key: flag.key, flag, defaultValue: flag.value })
    await defaultStrategy.visitorExposed({ key: flag.key, flag, defaultValue: flag.value })
    await defaultStrategy.visitorExposed({ key: flag2.key, flag: flag2, defaultValue: flag2.value })
    await defaultStrategy.visitorExposed({ key: flag2.key, flag: flag2, defaultValue: flag2.value })
    expect(activateFlag).toBeCalledTimes(2)
  })

  it('test sendHitAsync with literal object Event ', async () => {
    const hit = {
      type: HitType.EVENT,
      action: 'action_1',
      category: EventCategory.ACTION_TRACKING
    }
    await defaultStrategy.sendHit(hit)
    await defaultStrategy.sendHit(hit)
    await defaultStrategy.sendHit({ ...hit, action: 'action_2' })
    await defaultStrategy.sendHit({ ...hit, action: 'action_2' })
    await defaultStrategy.sendHit({ ...hit, action: 'action_2' })
    expect(addHit).toBeCalledTimes(2)
  })
})

describe('Clean cache', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 1 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')

  addHit.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
  const murmurHash = new MurmurHash()
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  it('should ', async () => {
    getCampaignsAsync.mockResolvedValue([])
    getModifications.mockReturnValue(returnFlag)
    await defaultStrategy.fetchFlags()
  })
  it('test clean cache ', async () => {
    const flagBoolean = returnFlag.get('keyBoolean')
    const flagKey = returnFlag.get('key')
    const flagArray = returnFlag.get('array')
    defaultStrategy.visitorExposed({ key: flagBoolean?.key as string, flag: flagBoolean, defaultValue: false })
    defaultStrategy.visitorExposed({ key: flagKey?.key as string, flag: flagKey, defaultValue: 'default value' })
    defaultStrategy.visitorExposed({ key: flagArray?.key as string, flag: flagArray, defaultValue: [] })
    await sleep(1200)
    await defaultStrategy.visitorExposed({ key: flagBoolean?.key as string, flag: flagBoolean, defaultValue: false })
    expect(activateFlag).toBeCalledTimes(4)
  })
})
