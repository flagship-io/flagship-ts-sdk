import { jest, expect, it, describe } from '@jest/globals'
import { Flagship, DecisionMode } from '../../src'
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

describe('test start in Bucketing mode', () => {
  it('should ', () => {
    Flagship.start('envId', 'apiKey', {
      decisionMode: DecisionMode.BUCKETING
    })
    Flagship.start('envId', 'apiKey', {
      decisionMode: DecisionMode.BUCKETING,
      pollingInterval: 0
    })
    expect(startPolling).toBeCalledTimes(2)
  })
})
