/**
 * @jest-environment jsdom
 */
import { jest, expect, it, describe, beforeAll } from '@jest/globals'

import { Flagship } from '../../src/main/Flagship'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import * as utils from '../../src/utils/utils'
import * as qaAssistant from '../../src/qaAssistant'

const getCampaignsAsync = jest.fn().mockReturnValue(Promise.resolve([]))

jest.mock('../../src/decision/ApiManager', () => {
  return {
    ApiManager: jest.fn().mockImplementation(() => {
      return {
        getCampaignsAsync,
        getModifications: jest.fn(),
        statusChangedCallback: jest.fn()
      }
    })
  }
})

const startBatchingLoop = jest.fn<()=>Promise<void>>()
startBatchingLoop.mockResolvedValue()
const addHit = jest.fn<()=>Promise<void>>()

const stopBatchingLoop = jest.fn<()=>Promise<void>>()

const sendBatch = jest.fn<()=>Promise<void>>()

const sendTroubleshootingHit = jest.fn<()=>Promise<void>>()

const addTroubleshootingHit = jest.fn<()=>Promise<void>>()

const sendUsageHit = jest.fn<()=>Promise<void>>()

addHit.mockResolvedValue()

jest.mock('../../src/api/TrackingManager', () => {
  return {
    TrackingManager: jest.fn().mockImplementation(() => {
      return {
        startBatchingLoop,
        stopBatchingLoop,
        sendBatch,
        addHit,
        sendTroubleshootingHit,
        addTroubleshootingHit,
        sendUsageHit
      }
    })
  }
})

describe('test Flagship newVisitor', () => {
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser')
  const launchQaAssistantSpy = jest.spyOn(qaAssistant, 'launchQaAssistant')
  launchQaAssistantSpy.mockImplementation(() => {
    //
  })
  beforeAll(() => {
    isBrowserSpy.mockReturnValue(true)
  })
  it('should ', async () => {
    const logManager = new FlagshipLogManager()

    await Flagship.start('envId', 'apiKey', {
      logManager,
      fetchNow: false
    })

    expect(window?.ABTastyWebSdk?.v1?.getActionTrackingNonce).toBeDefined()
    expect(window?.ABTastyWebSdk?.v1?.getActionTrackingNonce()).toBeUndefined()

    const visitor4 = Flagship.newVisitor({ visitorId: 'visitor_4', hasConsented: true })
    expect(Flagship.getVisitor()).toBeDefined()
    expect(visitor4).toEqual(Flagship.getVisitor())

    expect(window?.ABTastyWebSdk?.v1?.getActionTrackingNonce()).toEqual(expect.any(String))
  })
})
