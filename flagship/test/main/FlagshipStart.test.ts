import { jest, expect, it, describe } from '@jest/globals'
import { Flagship, DecisionMode, FlagshipStatus } from '../../src'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'

describe('test not ready', () => {
  const envId = 'envId'
  const apiKey = 'apiKey'
  const logManager = new FlagshipLogManager()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FlagshipAny = Flagship as any
  FlagshipAny.isReady = jest.fn().mockReturnValue(false)
  const instance = FlagshipAny.start(envId, apiKey, { decisionMode: DecisionMode.DECISION_API, logManager })
  it('should ', () => {
    expect(instance).toBeInstanceOf(Flagship)
    expect(Flagship.getStatus()).toBe(FlagshipStatus.NOT_INITIALIZED)
  })
})
