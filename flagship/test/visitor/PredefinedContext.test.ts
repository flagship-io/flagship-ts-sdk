import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ApiManager } from '../../src/decision/ApiManager'
import { PREDEFINED_CONTEXT_TYPE_ERROR, PROCESS_UPDATE_CONTEXT, SDK_LANGUAGE, SDK_VERSION } from '../../src/enum'
import { APP_VERSION_CODE, APP_VERSION_NAME, FLAGSHIP_VISITOR, INTERNET_CONNECTION } from '../../src/enum/FlagshipContext'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { sprintf } from '../../src/utils/utils'
import { DefaultStrategy } from '../../src/visitor/DefaultStrategy'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'

describe('test DefaultStrategy ', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const visitorDelegate = new VisitorDelegate({
    visitorId,
    context,
    hasConsented: true,
    configManager: {
      config,
      decisionManager: {} as ApiManager,
      trackingManager: {} as TrackingManager
    }
  })
  const defaultStrategy = new DefaultStrategy(visitorDelegate)

  const predefinedContext = {
    fs_client: SDK_LANGUAGE,
    fs_version: SDK_VERSION,
    fs_users: visitorDelegate.visitorId
  }
  const expectContext = { sdk_versionCode: 5, sdk_versionName: 'name', town: 'London', ...context, ...predefinedContext }
  it('should ', () => {
    const newContext = {
      [APP_VERSION_CODE]: 5,
      [APP_VERSION_NAME]: 'name',
      town: 'London'
    }
    defaultStrategy.updateContext(newContext)
    expect(visitorDelegate.context).toEqual(expectContext)
  })

  it('test error type', () => {
    const newContext = {
      [APP_VERSION_CODE]: 5,
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
      'sdk_internetConnection',
      'string'), PROCESS_UPDATE_CONTEXT)
  })
})
