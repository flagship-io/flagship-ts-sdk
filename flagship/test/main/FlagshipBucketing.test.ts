import { jest, expect, it, describe } from '@jest/globals'
import { Flagship, DecisionMode, Visitor } from '../../src'
import { IFlagshipConfig } from '../../src/config'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { HttpClient } from '../../src/utils/HttpClient'

const startPolling = jest.fn()
const stopPolling = jest.fn()
jest.mock('../../src/decision/BucketingManager', () => {
  return {
    BucketingManager: jest.fn().mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { BucketingManager } = jest.requireActual('../../src/decision/BucketingManager') as any
      return Object.assign(new BucketingManager({} as HttpClient, {} as IFlagshipConfig, {} as MurmurHash), { startPolling, stopPolling })
    })
  }
})

const startBatchingLoop = jest.fn<()=>Promise<void>>()
startBatchingLoop.mockResolvedValue()
const addHit = jest.fn<()=>Promise<void>>()

addHit.mockResolvedValue()

const stopBatchingLoop = jest.fn<()=>Promise<void>>()
const sendTroubleshootingHit = jest.fn<()=>Promise<void>>()

jest.mock('../../src/api/TrackingManager', () => {
  return {
    TrackingManager: jest.fn().mockImplementation(() => {
      return {
        startBatchingLoop,
        stopBatchingLoop,
        addHit,
        sendTroubleshootingHit
      }
    })
  }
})

describe('test start in Bucketing mode', () => {
  it('should ', () => {
    Flagship.start('envId', 'apiKey', {
      decisionMode: DecisionMode.BUCKETING
    })
    const instance = Flagship.start('envId', 'apiKey', {
      decisionMode: DecisionMode.BUCKETING,
      pollingInterval: 0
    })

    expect(instance).toBeInstanceOf(Flagship)
    expect(startPolling).toBeCalledTimes(2)
    if (instance) {
      const context = {
        key: 'value'
      }
      const visitorId = 'visitorId'
      let visitor = instance.newVisitor(visitorId, context)
      expect(visitor).toBeInstanceOf(Visitor)
      if (visitor) {
        expect(visitor.context).toEqual(expect.objectContaining(context))
        expect(visitor.visitorId).toBe(visitorId)
      }

      visitor = instance.newVisitor({})
      expect(visitor).toBeInstanceOf(Visitor)

      visitor = instance.newVisitor(visitorId)
      expect(visitor).toBeInstanceOf(Visitor)
      if (visitor) {
        expect(visitor.visitorId).toBe(visitorId)
      }
    }
  })
})
