import { expect, it, describe } from '@jest/globals'
import { BucketingConfig } from '../../src/config'
import { DEFAULT_POLLING_INTERVAL } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'

describe('test BucketingConfig', () => {
  it('should ', () => {
    const config = new BucketingConfig()
    expect(config.pollingInterval).toBe(DEFAULT_POLLING_INTERVAL)
    expect(config.onBucketingUpdated).toBeUndefined()
  })

  it('should ', () => {
    const onBucketingUpdated = () => {
      //
    }
    const config = new BucketingConfig({ pollingInterval: 3000, onBucketingUpdated })
    expect(config.pollingInterval).toBe(3000)
    expect(config.onBucketingUpdated).toBe(onBucketingUpdated)
  })

  it('should ', () => {
    const logManager = new FlagshipLogManager()
    const config = new BucketingConfig({ fetchNow: true, logManager })
    expect(config.logManager).toBeInstanceOf(FlagshipLogManager)
    expect(config.logManager).toBe(logManager)
    expect(config.pollingInterval).toBe(DEFAULT_POLLING_INTERVAL)
  })
})
