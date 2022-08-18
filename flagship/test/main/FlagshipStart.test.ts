import { jest, expect, it, describe } from '@jest/globals'
import { Flagship, DecisionApiConfig } from '../../src'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { Mock } from 'jest-mock'
import { NEW_VISITOR_NOT_READY, PROCESS_NEW_VISITOR } from '../../src/enum'

const startBatchingLoop: Mock<Promise<void>, []> = jest.fn()
startBatchingLoop.mockResolvedValue()
const addHit: Mock<Promise<void>, []> = jest.fn()

addHit.mockResolvedValue()

const stopBatchingLoop:Mock<Promise<void>, []> = jest.fn()

jest.mock('../../src/api/TrackingManager', () => {
  return {
    TrackingManager: jest.fn().mockImplementation(() => {
      return {
        startBatchingLoop,
        stopBatchingLoop,
        addHit
      }
    })
  }
})

describe('Test newVisitor without starting the SDK', () => {
  const logManager = new FlagshipLogManager()
  const config = new DecisionApiConfig()

  config.logManager = logManager
  const errorLog = jest.spyOn(logManager, 'error')

  const getConfig = jest.fn()
  getConfig.mockReturnValue(config)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FlagshipAny = Flagship as any
  FlagshipAny.getConfig = getConfig

  it('should ', () => {
    const visitor = Flagship.newVisitor()
    expect(visitor).toBeNull()
    expect(errorLog).toBeCalledTimes(1)
    expect(errorLog).toBeCalledWith(NEW_VISITOR_NOT_READY, PROCESS_NEW_VISITOR)
  })
})
