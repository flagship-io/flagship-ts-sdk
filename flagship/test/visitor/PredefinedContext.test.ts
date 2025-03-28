import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ApiManager } from '../../src/decision/ApiManager'
import { PREDEFINED_CONTEXT_TYPE_ERROR, PROCESS_UPDATE_CONTEXT, SDK_INFO } from '../../src/enum'
import { APP_VERSION_CODE, APP_VERSION_NAME, FLAGSHIP_VISITOR, INTERNET_CONNECTION, LOCATION_LAT } from '../../src/enum/FlagshipContext'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { sprintf } from '../../src/utils/utils'
import { DefaultStrategy } from '../../src/visitor/DefaultStrategy'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'

describe('test DefaultStrategy ', () => {
  const visitorId = 'visitorId'
   
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const trackingManager = new TrackingManager({} as HttpClient, config)

  const emotionAi = {
    init: jest.fn<(visitor:VisitorAbstract) => void>()
  } as unknown as IEmotionAI

  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    hasConsented: true,
    configManager: {
      config,
      decisionManager: {} as ApiManager,
      trackingManager
    },
    emotionAi
  })
  const murmurHash = new MurmurHash()
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  const predefinedContext = {
    fs_client: SDK_INFO.name,
    fs_version: SDK_INFO.version,
    fs_users: visitorDelegate.visitorId
  }
  const expectContext = { sdk_versionCode: '5', sdk_versionName: 'name', [LOCATION_LAT]: 555.55, town: 'London', ...context, ...predefinedContext }
  it('should ', () => {
    const newContext = {
      [APP_VERSION_CODE]: '5',
      [APP_VERSION_NAME]: 'name',
      [LOCATION_LAT]: 555.55,
      town: 'London'
    }
    defaultStrategy.updateContext(newContext)
    expect(visitorDelegate.context).toEqual(expectContext)
  })

  it('test error type', () => {
    const newContext = {
      [APP_VERSION_CODE]: '5',
      town: 'Tokyo',
      [INTERNET_CONNECTION]: 10, // must be string
      [FLAGSHIP_VISITOR]: 'user', // start with fs
      fs_version: 5 // start with fs
    }
    defaultStrategy.updateContext(newContext)
    expect(visitorDelegate.context).toEqual({ ...expectContext, town: 'Tokyo' })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(
      PREDEFINED_CONTEXT_TYPE_ERROR,
      visitorId,
      'sdk_internetConnection',
      'string'), PROCESS_UPDATE_CONTEXT)
  })
})
