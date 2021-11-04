import { expect, it, describe } from '@jest/globals'
import { BucketingConfig } from '../../src/config'
import { DEFAULT_POLLING_INTERVAL, REQUEST_TIME_OUT } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'

describe('test BucketingConfig', () => {
  it('should ', () => {
    const config = new BucketingConfig()
    expect(config.pollingInterval).toBe(DEFAULT_POLLING_INTERVAL)
    expect(config.onBucketingSuccess).toBeUndefined()
    expect(config.onBucketingFail).toBeUndefined()
    expect(config.onBucketingUpdated).toBeUndefined()
  })

  it('should ', () => {
    const onBucketingSuccess = () => {
      //
    }
    const onBucketingFail = () => {
      //
    }
    const onBucketingUpdated = () => {
      //
    }
    const config = new BucketingConfig({ pollingInterval: 3000, onBucketingSuccess, onBucketingFail, onBucketingUpdated })
    expect(config.pollingInterval).toBe(3000)
    expect(config.onBucketingSuccess).toBe(onBucketingSuccess)
    expect(config.onBucketingFail).toBe(onBucketingFail)
    expect(config.onBucketingUpdated).toBe(onBucketingUpdated)
  })

  it('should ', () => {
    const logManager = new FlagshipLogManager()
    const config = new BucketingConfig({ fetchNow: true, logManager: logManager })
    expect(config.logManager).toBeInstanceOf(FlagshipLogManager)
    expect(config.logManager).toBe(logManager)
    expect(config.pollingInterval).toBe(DEFAULT_POLLING_INTERVAL)
  })
})
