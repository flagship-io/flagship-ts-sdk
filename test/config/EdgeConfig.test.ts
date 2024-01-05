import { DecisionMode } from './../../src/config/DecisionMode'
import { EdgeConfig } from './../../src/config/EdgeConfig'
import { expect, it, describe } from '@jest/globals'

describe('test EdgeConfig', () => {
  it('should ', () => {
    const config = new EdgeConfig()
    expect(config.decisionMode).toBe(DecisionMode.BUCKETING_EDGE)
  })
})
