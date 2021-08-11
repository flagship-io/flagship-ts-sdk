import { expect, it, describe } from '@jest/globals'
import { BucketingConfig } from '../../src/config'
import { REQUEST_TIME_OUT } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'

describe('test BucketingConfig', () => {
  it('should ', () => {
    const config = new BucketingConfig()
    expect(config.pollingInterval).toBe(REQUEST_TIME_OUT)
  })

  it('should ', () => {
    const config = new BucketingConfig({ pollingInterval: 3000 })
    expect(config.pollingInterval).toBe(3000)
  })

  it('should ', () => {
    const logManager = new FlagshipLogManager()
    const config = new BucketingConfig({ fetchNow: true, logManager: logManager })
    expect(config.logManager).toBeInstanceOf(FlagshipLogManager)
    expect(config.logManager).toBe(logManager)
    expect(config.pollingInterval).toBe(REQUEST_TIME_OUT)
  })
})
