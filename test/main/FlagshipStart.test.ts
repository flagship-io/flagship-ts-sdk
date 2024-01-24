import { jest, expect, it, describe } from '@jest/globals'
import { Flagship, DecisionApiConfig, Visitor } from '../../src'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { NEW_VISITOR_NOT_READY, PROCESS_NEW_VISITOR } from '../../src/enum'

const startBatchingLoop = jest.fn<()=>Promise<void>>()
startBatchingLoop.mockResolvedValue()
const addHit = jest.fn<()=>Promise<void>>()

addHit.mockResolvedValue()

const stopBatchingLoop = jest.fn<()=>void>()
const sendTroubleshootingHit = jest.fn<()=>Promise<void>>()
const addTroubleshootingHit = jest.fn<()=>Promise<void>>()

jest.mock('../../src/api/TrackingManager', () => {
  return {
    TrackingManager: jest.fn().mockImplementation(() => {
      return {
        startBatchingLoop,
        stopBatchingLoop,
        addHit,
        sendTroubleshootingHit,
        addTroubleshootingHit
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
    expect(visitor).toBeInstanceOf(Visitor)
    expect(errorLog).toBeCalledTimes(1)
    expect(errorLog).toBeCalledWith(NEW_VISITOR_NOT_READY, PROCESS_NEW_VISITOR)
  })
})
