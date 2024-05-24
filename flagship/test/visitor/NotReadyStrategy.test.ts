import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { DecisionManager } from '../../src/decision/DecisionManager'
import { FLAG_METADATA, FLAG_VISITOR_EXPOSED, FSSdkStatus, HitType, LogLevel, METADATA_SDK_NOT_READY, METHOD_DEACTIVATED_ERROR } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { sprintf } from '../../src/utils/utils'
import { VisitorDelegate, NotReadyStrategy } from '../../src/visitor'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { Troubleshooting } from '../../src/hit/Troubleshooting'

describe('test NotReadyStrategy', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', logLevel: LogLevel.ERROR })
  config.logManager = logManager

  const trackingManager = new TrackingManager({} as HttpClient, config)

  const sendUsageHitSpy = jest.spyOn(trackingManager, 'sendUsageHit')
  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  const configManager = new ConfigManager(config, {} as DecisionManager, trackingManager)
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager, hasConsented: true })
  const murmurHash = new MurmurHash()
  const notReadyStrategy = new NotReadyStrategy({ visitor: visitorDelegate, murmurHash })

  it('test fetchFlags', () => {
    notReadyStrategy.fetchFlags().then(() => {
      const methodName = 'fetchFlags'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_NOT_INITIALIZED]), methodName)
    })
  })

  it('test getFlagValue', () => {
    const defaultValue = 'value'
    const flagValue = notReadyStrategy.getFlagValue({ key: 'key', defaultValue })
    const methodName = 'Flag.value'
    expect(flagValue).toBe(defaultValue)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_NOT_INITIALIZED]), methodName)
  })

  it('test getFlagMetadata', () => {
    const key = 'flagKey'
    const metadata = notReadyStrategy.getFlagMetadata({ key })
    expect(metadata).toEqual({
      campaignId: '',
      slug: null,
      variationGroupId: '',
      campaignType: '',
      variationId: '',
      isReference: false,
      campaignName: '',
      variationGroupName: '',
      variationName: ''
    })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METADATA_SDK_NOT_READY, visitorId, key, metadata), FLAG_METADATA)
  })

  it('test visitorExposed', async () => {
    await notReadyStrategy.visitorExposed()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, FLAG_VISITOR_EXPOSED, FSSdkStatus[FSSdkStatus.SDK_NOT_INITIALIZED]), FLAG_VISITOR_EXPOSED)
  })

  it('test sendHit', () => {
    notReadyStrategy.sendHit({ type: HitType.PAGE, documentLocation: 'home' }).then(() => {
      const methodName = 'sendHit'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_NOT_INITIALIZED]), methodName)
    })
  })

  it('test sendHits', () => {
    notReadyStrategy.sendHits([{ type: HitType.PAGE, documentLocation: 'home' }]).then(() => {
      const methodName = 'sendHits'
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_ERROR, visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_NOT_INITIALIZED]), methodName)
    })
  })

  it('test sendTroubleshootingHit', () => {
    notReadyStrategy.sendTroubleshootingHit({} as Troubleshooting)
    expect(sendTroubleshootingHit).toBeCalledTimes(0)
  })

  it('test sendAnalyticHit', () => {
    notReadyStrategy.sendSdkConfigAnalyticHit()
    expect(sendUsageHitSpy).toBeCalledTimes(0)
  })
})
