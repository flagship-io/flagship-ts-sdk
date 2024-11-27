import { jest, expect, it, describe } from '@jest/globals'
import { Flagship, DecisionMode, Visitor, NewVisitor } from '../../src'
import { IFlagshipConfig } from '../../src/config'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { HttpClient } from '../../src/utils/HttpClient'
import { EAIConfig } from '../../src/type.local'

const initSdk = jest.fn<()=>Promise<void>>()
const resetSdk = jest.fn<()=>void>()
const getEAIConfig = jest.fn<()=>EAIConfig|undefined>()

jest.mock('../../src/main/BucketingSdkManager.ts', () => {
  return {
    BucketingSdkManager: jest.fn().mockImplementation(() => {
      return {
        initSdk,
        resetSdk,
        getEAIConfig
      }
    })
  }
})

const startBatchingLoop = jest.fn<()=>Promise<void>>()
startBatchingLoop.mockResolvedValue()
const addHit = jest.fn<()=>Promise<void>>()

addHit.mockResolvedValue()

const stopBatchingLoop = jest.fn<()=>Promise<void>>()
const sendTroubleshootingHit = jest.fn<()=>Promise<void>>()
const addTroubleshootingHit = jest.fn<()=>Promise<void>>()
const sendUsageHit = jest.fn<()=>Promise<void>>()
jest.mock('../../src/api/TrackingManager', () => {
  return {
    TrackingManager: jest.fn().mockImplementation(() => {
      return {
        startBatchingLoop,
        stopBatchingLoop,
        addHit,
        sendTroubleshootingHit,
        addTroubleshootingHit,
        sendUsageHit
      }
    })
  }
})

describe('test start in Bucketing mode', () => {
  it('should ', async () => {
    initSdk.mockResolvedValue()
    getEAIConfig.mockReturnValue(undefined)

    await Flagship.start('envId', 'apiKey', {
      decisionMode: DecisionMode.BUCKETING
    })
    const instance = await Flagship.start('envId', 'apiKey', {
      decisionMode: DecisionMode.BUCKETING,
      pollingInterval: 0
    })

    expect(instance).toBeInstanceOf(Flagship)
    expect(initSdk).toBeCalledTimes(2)
    if (instance) {
      const context = {
        key: 'value'
      }
      const visitorId = 'visitorId'
      let visitor = instance.newVisitor({ visitorId, context, hasConsented: true })
      expect(visitor).toBeInstanceOf(Visitor)
      if (visitor) {
        expect(visitor.context).toEqual(expect.objectContaining(context))
        expect(visitor.visitorId).toBe(visitorId)
      }

      visitor = instance.newVisitor({} as NewVisitor)
      expect(visitor).toBeInstanceOf(Visitor)

      visitor = instance.newVisitor({ visitorId, hasConsented: true })
      expect(visitor).toBeInstanceOf(Visitor)
      if (visitor) {
        expect(visitor.visitorId).toBe(visitorId)
      }
    }
  })
})
