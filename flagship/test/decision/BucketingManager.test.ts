import { jest, expect, it, describe } from '@jest/globals'
import { BucketingConfig } from '../../src/config/BucketingConfig'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { BucketingManager } from '../../src/decision/BucketingManager'
import { HttpClient } from '../../src/utils/NodeHttpClient'
import { bucketing } from './bucketing'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { ConfigManager } from '../../src/config'
import { BUCKETING_API_CONTEXT_URL, BUCKETING_API_URL, FlagshipStatus, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, SDK_LANGUAGE, SDK_VERSION } from '../../src/enum'
import { sprintf } from '../../src/utils/utils'
import { IHttpResponse } from '../../src/utils/httpClient'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { BucketingDTO } from '../../src/decision/api/bucketingDTO'

describe('test BucketingManager', () => {
  const config = new BucketingConfig({ pollingInterval: 0 })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()

  const getAsync = jest.spyOn(httpClient, 'getAsync')

  const bucketingManager = new BucketingManager(httpClient, config, murmurHash)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendContext = jest.spyOn(bucketingManager as any, 'sendContext')

  sendContext.mockReturnValue(Promise.resolve())

  const visitorId = 'visitor_1'
  const context = {
    age: 20
  }

  const visitor = new VisitorDelegate({ visitorId, context, configManager: {} as ConfigManager })

  it('test getCampaignsAsync empty', async () => {
    const campaigns = await bucketingManager.getCampaignsAsync(visitor)
    expect(campaigns).toHaveLength(0)
    expect(sendContext).toBeCalledTimes(1)
  })

  it('test getCampaignsAsync panic mode', async () => {
    getAsync.mockResolvedValue({ body: { panic: true }, status: 200 })
    await bucketingManager.startPolling()
    const campaigns = await bucketingManager.getCampaignsAsync(visitor)
    expect(campaigns).toHaveLength(0)
    expect(bucketingManager.isPanic()).toBeTruthy()
    expect(sendContext).toBeCalledTimes(1)
  })

  it('test getCampaignsAsync campaign empty', async () => {
    getAsync.mockResolvedValue({
      body: {
        campaigns: [{
          variationGroups: []
        }]
      },
      status: 200
    })
    await bucketingManager.startPolling()
    const campaigns = await bucketingManager.getCampaignsAsync(visitor)
    expect(campaigns).toHaveLength(0)
    bucketingManager.stopPolling()
    expect(sendContext).toBeCalledTimes(1)
  })

  const headers = { 'last-modified': 'Fri, 06 Aug 2021 11:16:19 GMT' }
  const url = sprintf(BUCKETING_API_URL, config.envId)
  it('test getCampaignsAsync campaign empty', async () => {
    getAsync.mockResolvedValue({ body: {}, status: 200, headers })
    await bucketingManager.startPolling()
    const campaigns = await bucketingManager.getCampaignsAsync(visitor)
    expect(campaigns).toHaveLength(0)
    expect(bucketingManager.isPanic()).toBeFalsy()
    expect(getAsync).toBeCalledTimes(1)
    expect(getAsync).toBeCalledWith(url, {
      headers: {
        [HEADER_X_API_KEY]: `${config.apiKey}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }
    })
    expect(sendContext).toBeCalledTimes(1)
  })

  it('test getCampaignsAsync campaign', async () => {
    getAsync.mockResolvedValue({ body: bucketing, status: 200 })
    await bucketingManager.startPolling()
    const modifications = await bucketingManager.getCampaignsModificationsAsync(visitor)
    expect(modifications.size).toBe(6)
    expect(getAsync).toBeCalledTimes(1)
    expect(getAsync).toBeCalledWith(url, {
      headers: {
        [HEADER_X_API_KEY]: `${config.apiKey}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON,
        'if-modified-since': 'Fri, 06 Aug 2021 11:16:19 GMT'
      }
    })
  })
})

describe('test update', () => {
  const onBucketingSuccess = (param: {
    status: number
    payload: BucketingDTO}) => {
    expect(param).toEqual({ status: 200, payload: bucketing })
  }
  const config = new BucketingConfig({ pollingInterval: 0, onBucketingSuccess })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()

  const getAsync = jest.spyOn(httpClient, 'getAsync')

  const bucketingManager = new BucketingManager(httpClient, config, murmurHash)

  it('test', async () => {
    getAsync.mockResolvedValue({ body: bucketing, status: 200 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFlagshipStatus = jest.spyOn(bucketingManager as any, 'updateFlagshipStatus')
    let count = 0
    bucketingManager.statusChangedCallback((status) => {
      switch (count) {
        case 0:
          expect(status).toBe(FlagshipStatus.POLLING)
          break
        case 1:
          expect(status).toBe(FlagshipStatus.READY)
          break
        default:
          break
      }
      count++
    })
    await bucketingManager.startPolling()
    await bucketingManager.startPolling()
    expect(updateFlagshipStatus).toBeCalledTimes(2)
  })
})

describe('test error', () => {
  const error = new Error('Error')
  const onBucketingFail = (error: Error) => {
    expect(error).toEqual(error)
  }
  const config = new BucketingConfig({ pollingInterval: 0, onBucketingFail })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()

  const getAsync = jest.spyOn(httpClient, 'getAsync')

  const bucketingManager = new BucketingManager(httpClient, config, murmurHash)

  it('test', async () => {
    getAsync.mockRejectedValue(error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFlagshipStatus = jest.spyOn(bucketingManager as any, 'updateFlagshipStatus')
    let count = 0
    bucketingManager.statusChangedCallback((status) => {
      switch (count) {
        case 0:
          expect(status).toBe(FlagshipStatus.POLLING)
          break
        case 1:
          expect(status).toBe(FlagshipStatus.NOT_INITIALIZED)
          break
        default:
          break
      }
      count++
    })

    await bucketingManager.startPolling()
    expect(updateFlagshipStatus).toBeCalledTimes(2)
  })
})

describe('test sendContext', () => {
  const config = new BucketingConfig({ pollingInterval: 0 })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()
  const logManager = new FlagshipLogManager()

  const logError = jest.spyOn(logManager, 'error')

  const postAsync = jest.spyOn(httpClient, 'postAsync')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bucketingManager = new BucketingManager(httpClient, config, murmurHash) as any

  const visitorId = 'visitor_1'
  const context = {
    age: 20
  }
  const visitor = new VisitorDelegate({ visitorId, context, configManager: {} as ConfigManager })

  it('should ', () => {
    const url = sprintf(BUCKETING_API_CONTEXT_URL, config.envId)
    const headers:Record<string, string> = {
      [HEADER_X_API_KEY]: `${config.apiKey}`,
      [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
      [HEADER_X_SDK_VERSION]: SDK_VERSION,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }
    const body = {
      visitorId: visitor.visitorId,
      type: 'CONTEXT',
      data: visitor.context
    }

    postAsync.mockResolvedValue({} as IHttpResponse)
    bucketingManager.sendContext(visitor).then(() => {
      expect(postAsync).toBeCalledTimes(1)
      expect(postAsync).toBeCalledWith(url, {
        headers, body
      })
    })
  })

  it('should ', () => {
    const messageError = 'error'
    postAsync.mockRejectedValue(messageError)
    bucketingManager.sendContext(visitor)
      .catch(() => {
        expect(postAsync).toBeCalledTimes(1)
        expect(logError).toBeCalledTimes(1)
      })
  })
})

describe('test bucketing method', () => {
  const config = new BucketingConfig({ pollingInterval: 0 })
  const murmurHash = new MurmurHash()
  const httpClient = new HttpClient()

  const bucketingManager = new BucketingManager(httpClient, config, murmurHash)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bucketingManagerAny = bucketingManager as any

  const visitorId = '123456'

  const context = {
    age: 20
  }

  const visitor = new VisitorDelegate({ visitorId, context, configManager: {} as ConfigManager })

  const variations = [
    {
      id: 'c20j8bk3fk9hdphqtd30',
      modifications: {
        type: 'HTML',
        value: {
          my_html: '<div>\n  <p>Original</p>\n</div>'
        }
      },
      allocation: 34,
      reference: true
    },
    {
      id: 'c20j8bk3fk9hdphqtd3g',
      modifications: {
        type: 'HTML',
        value: {
          my_html: '<div>\n  <p>variation 1</p>\n</div>'
        }
      },
      allocation: 33
    },
    {
      id: 'c20j9lgbcahhf2mvhbf0',
      modifications: {
        type: 'HTML',
        value: {
          my_html: '<div>\n  <p>variation 2</p>\n</div>'
        }
      },
      allocation: 33
    }
  ]
  const variationGroups = {
    id: '9273BKSDJtoto',
    variations
  }
  it('test getVariation ', () => {
    const response = bucketingManagerAny.getVariation(variationGroups, visitorId)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { allocation, ...variation } = variations[0]
    expect(response).toEqual(variation)
  })

  it('test isMatchTargeting with empty VariationGroupDTO ', () => {
    const checkAndTargeting = jest.spyOn(bucketingManagerAny, 'checkAndTargeting')
    const response = bucketingManagerAny.isMatchTargeting([], visitor)
    expect(response).toBeFalsy()
    expect(checkAndTargeting).toBeCalledTimes(0)
  })
  it('test isMatchTargeting ', () => {
    const checkAndTargeting = jest.spyOn(bucketingManagerAny, 'checkAndTargeting')
    const response = bucketingManagerAny.isMatchTargeting({
      targeting: {
        targetingGroups: [
          {
            targetings: [{
              key: 'age',
              operator: 'EQUALS',
              value: 21
            }]
          }
        ]
      }
    }, visitor)
    expect(response).toBeFalsy()
    expect(checkAndTargeting).toBeCalledTimes(1)
  })

  it('test isMatchTargeting ', () => {
    const checkAndTargeting = jest.spyOn(bucketingManagerAny, 'checkAndTargeting')
    const response = bucketingManagerAny.isMatchTargeting({
      targeting: {
        targetingGroups: [
          {
            targetings: [{
              key: 'age',
              operator: 'EQUALS',
              value: 21
            }]
          },
          {
            targetings: [{
              key: 'fs_all_users',
              operator: 'EQUALS',
              value: ''
            }]
          },
          {
            key: 'fs_users',
            operator: 'EQUALS',
            value: visitorId
          }

        ]
      }
    }, visitor)
    expect(response).toBeTruthy()
    expect(checkAndTargeting).toBeCalledTimes(2)
  })

  it('test checkAndTargeting', () => {
    const response = bucketingManagerAny.checkAndTargeting([], visitor)
    expect(response).toBeFalsy()
  })

  const targetingAllUsers = {
    key: 'fs_all_users',
    operator: 'EQUALS',
    value: ''
  }

  it('test checkAndTargeting fs_all_users', () => {
    const response = bucketingManagerAny.checkAndTargeting([targetingAllUsers], visitor)
    expect(response).toBeTruthy()
  })

  it('test checkAndTargeting fs_all_users', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingFsUsers = {
      key: 'fs_users',
      operator: 'EQUALS',
      value: visitorId
    }
    const response = bucketingManagerAny.checkAndTargeting([targetingFsUsers], visitor)
    expect(response).toBeTruthy()
    expect(testOperator).toBeCalledTimes(1)
    expect(testOperator).toBeCalledWith(targetingFsUsers.operator, visitorId, targetingFsUsers.value)
  })

  it('test checkAndTargeting key not match context', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingKeyContext = {
      key: 'anyKey',
      operator: 'EQUALS',
      value: 'anyValue'
    }
    const response = bucketingManagerAny.checkAndTargeting([targetingKeyContext], visitor)
    expect(response).toBeFalsy()
    expect(testOperator).toBeCalledTimes(0)
  })

  it('test checkAndTargeting key match context', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingKeyContext = {
      key: 'age',
      operator: 'EQUALS',
      value: 20
    }
    const response = bucketingManagerAny.checkAndTargeting([targetingKeyContext], visitor)
    expect(response).toBeTruthy()
    expect(testOperator).toBeCalledTimes(1)
    expect(testOperator).toBeCalledWith(targetingKeyContext.operator, context.age, targetingKeyContext.value)
  })

  it('test checkAndTargeting ', () => {
    const testOperator = jest.spyOn(bucketingManagerAny, 'testOperator')
    const targetingKeyContext = {
      key: 'anyValue',
      operator: 'EQUALS',
      value: 21
    }
    const response = bucketingManagerAny.checkAndTargeting([targetingKeyContext, targetingAllUsers], visitor)
    expect(response).toBeTruthy()
    expect(testOperator).toBeCalledTimes(0)
  })

  it('test testOperator EQUALS Test different values', () => {
    const contextValue = 5
    const targetingValue = 6
    const response = bucketingManagerAny.testOperator('EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator EQUALS Test different type', () => {
    const contextValue = 5
    const targetingValue = '5'
    const response = bucketingManagerAny.testOperator('EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator EQUALS Test same type and value', () => {
    const contextValue = 5
    const targetingValue = 5
    const response = bucketingManagerAny.testOperator('EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator NOT_EQUALS Test different values', () => {
    const contextValue = 5
    const targetingValue = 6
    const response = bucketingManagerAny.testOperator('NOT_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator NOT_EQUALS Test different type', () => {
    const contextValue = 5
    const targetingValue = '5'
    const response = bucketingManagerAny.testOperator('NOT_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator NOT_EQUALS Test same type and value', () => {
    const contextValue = 5
    const targetingValue = 5
    const response = bucketingManagerAny.testOperator('NOT_EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator CONTAINS Test contextValue not contains targetingValue', () => {
    const contextValue = 5
    const targetingValue = [8, 7, 4, 1]
    const response = bucketingManagerAny.testOperator('CONTAINS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator CONTAINS Test contextValue contains targetingValue', () => {
    const contextValue = 5
    const targetingValue = [8, 7, 5, 1]
    const response = bucketingManagerAny.testOperator('CONTAINS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator CONTAINS Test contextValue contains targetingValue', () => {
    const contextValue = 'nopq_hij'
    const targetingValue = ['abc', 'dfg', 'hij', 'klm']
    const response = bucketingManagerAny.testOperator('CONTAINS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator NOT_CONTAINS Test contextValue not contains targetingValue', () => {
    const contextValue = 5
    const targetingValue = [8, 7, 4, 1]
    const response = bucketingManagerAny.testOperator('NOT_CONTAINS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator NOT_CONTAINS Test contextValue contains targetingValue', () => {
    const contextValue = 5
    const targetingValue = [8, 7, 5, 1]
    const response = bucketingManagerAny.testOperator('NOT_CONTAINS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator NOT_CONTAINS Test contextValue contains targetingValue', () => {
    const contextValue = 'nopq_hij'
    const targetingValue = ['abc', 'dfg', 'hij', 'klm']
    const response = bucketingManagerAny.testOperator('NOT_CONTAINS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 5
    const targetingValue = 6
    const response = bucketingManagerAny.testOperator('GREATER_THAN', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 5
    const targetingValue = 5
    const response = bucketingManagerAny.testOperator('GREATER_THAN', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 'a'
    const targetingValue = 'b'
    const response = bucketingManagerAny.testOperator('GREATER_THAN', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 'abz'
    const targetingValue = 'bcg'
    const response = bucketingManagerAny.testOperator('GREATER_THAN', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN Test contextValue GREATER_THAN targetingValue', () => {
    const contextValue = 8
    const targetingValue = 5
    const response = bucketingManagerAny.testOperator('GREATER_THAN', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator GREATER_THAN Test contextValue GREATER_THAN targetingValue', () => {
    const contextValue = '9dlk'
    const targetingValue = '8'
    const response = bucketingManagerAny.testOperator('GREATER_THAN', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator LOWER_THAN Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 5
    const targetingValue = 6
    const response = bucketingManagerAny.testOperator('LOWER_THAN', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator LOWER_THAN Test contextValue not GREATER_THAN targetingValue', () => {
    const contextValue = 5
    const targetingValue = 5
    const response = bucketingManagerAny.testOperator('LOWER_THAN', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator LOWER_THAN Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 'a'
    const targetingValue = 'b'
    const response = bucketingManagerAny.testOperator('LOWER_THAN', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator LOWER_THAN Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 'abz'
    const targetingValue = 'bcg'
    const response = bucketingManagerAny.testOperator('LOWER_THAN', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator LOWER_THAN Test contextValue not LOWER_THAN targetingValue', () => {
    const contextValue = 8
    const targetingValue = 2
    const response = bucketingManagerAny.testOperator('LOWER_THAN', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN_OR_EQUALS Test contextValue GREATER_THAN targetingValue', () => {
    const contextValue = 8
    const targetingValue = 2
    const response = bucketingManagerAny.testOperator('GREATER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator GREATER_THAN_OR_EQUALS Test contextValue EQUALS targetingValue', () => {
    const contextValue = 8
    const targetingValue = 8
    const response = bucketingManagerAny.testOperator('GREATER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator GREATER_THAN_OR_EQUALS Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 7
    const targetingValue = 8
    const response = bucketingManagerAny.testOperator('GREATER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator GREATER_THAN_OR_EQUALS Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 'a'
    const targetingValue = 'b'
    const response = bucketingManagerAny.testOperator('GREATER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator LOWER_THAN_OR_EQUALS Test contextValue GREATER_THAN targetingValue', () => {
    const contextValue = 8
    const targetingValue = 6
    const response = bucketingManagerAny.testOperator('LOWER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator LOWER_THAN_OR_EQUALS Test contextValue EQUALS targetingValue', () => {
    const contextValue = 8
    const targetingValue = 8
    const response = bucketingManagerAny.testOperator('LOWER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator LOWER_THAN_OR_EQUALS Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 7
    const targetingValue = 8
    const response = bucketingManagerAny.testOperator('LOWER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator LOWER_THAN_OR_EQUALS Test contextValue LOWER_THAN targetingValue', () => {
    const contextValue = 'a'
    const targetingValue = 'b'
    const response = bucketingManagerAny.testOperator('LOWER_THAN_OR_EQUALS', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator STARTS_WITH Test contextValue STARTS_WITH targetingValue', () => {
    const contextValue = 'abcd'
    const targetingValue = 'ab'
    const response = bucketingManagerAny.testOperator('STARTS_WITH', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator STARTS_WITH Test contextValue STARTS_WITH targetingValue', () => {
    const contextValue = 'abcd'
    const targetingValue = 'AB'
    const response = bucketingManagerAny.testOperator('STARTS_WITH', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator STARTS_WITH Test contextValue STARTS_WITH targetingValue', () => {
    const contextValue = 'abcd'
    const targetingValue = 'ac'
    const response = bucketingManagerAny.testOperator('STARTS_WITH', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator ENDS_WITH Test contextValue ENDS_WITH targetingValue', () => {
    const contextValue = 'abcd'
    const targetingValue = 'cd'
    const response = bucketingManagerAny.testOperator('ENDS_WITH', contextValue, targetingValue)
    expect(response).toBeTruthy()
  })

  it('test testOperator ENDS_WITH Test contextValue ENDS_WITH targetingValue', () => {
    const contextValue = 'abcd'
    const targetingValue = 'CD'
    const response = bucketingManagerAny.testOperator('ENDS_WITH', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator ENDS_WITH Test contextValue ENDS_WITH targetingValue', () => {
    const contextValue = 'abcd'
    const targetingValue = 'bd'
    const response = bucketingManagerAny.testOperator('ENDS_WITH', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })

  it('test testOperator NotEXIST', () => {
    const contextValue = 'abcd'
    const targetingValue = 'bd'
    const response = bucketingManagerAny.testOperator('NotEXIST', contextValue, targetingValue)
    expect(response).toBeFalsy()
  })
})
