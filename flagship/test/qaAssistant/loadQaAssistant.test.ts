/**
 * @jest-environment jsdom
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals'
import { loadQaAssistant } from '../../src/qaAssistant/loadQaAssistant'
import { FS_FORCED_VARIATIONS, FS_IS_QA_MODE_ENABLED, QA_ASSISTANT_PROD_URL } from '../../src/enum/FlagshipConstant'
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig'
import * as appendScript from '../../src/qaAssistant/appendScript'
import { FsVariationToForce } from '../../src'
import * as handleIframeMessage from '../../src/qaAssistant/messages/handleIframeMessage'

describe('Test loadQaAssistant', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })
  const config = new DecisionApiConfig()
  config.envId = 'envId'
  const sessionStorageGetItemSpy = jest.spyOn(Object.getPrototypeOf(sessionStorage), 'getItem')
  const sessionStorageSetItemSpy = jest.spyOn(Object.getPrototypeOf(sessionStorage), 'setItem')
  const addEventListenerSpy = jest.spyOn(global.window, 'addEventListener')
  const appendScriptSpy = jest.spyOn(appendScript, 'appendScript')
  const handleIframeMessageSpy = jest.spyOn(handleIframeMessage, 'handleIframeMessage')
  it('test loadQaAssistant work correctly', () => {
    loadQaAssistant(config)
    expect(sessionStorageGetItemSpy).toBeCalledTimes(1)
    expect(sessionStorageGetItemSpy).toBeCalledWith(FS_FORCED_VARIATIONS)
    expect(addEventListenerSpy).toBeCalledTimes(1)
    expect(addEventListenerSpy).toBeCalledWith('message', expect.anything())
    expect(sessionStorageSetItemSpy).toBeCalledTimes(1)
    expect(sessionStorageSetItemSpy).toBeCalledWith(FS_IS_QA_MODE_ENABLED, 'true')
    expect(appendScriptSpy).toBeCalledTimes(1)
    expect(appendScriptSpy).toBeCalledWith(QA_ASSISTANT_PROD_URL)
    expect(config.isQAModeEnabled).toBeTruthy()
    expect(window.flagship).toBeDefined()
    expect(window.flagship?.envId).toBe(config.envId)
    expect(window.flagship?.forcedVariations).toEqual({})
  })

  it('test loadQaAssistant session storage return forced variations', () => {
    const forcedVariations:FsVariationToForce = {
      campaignId: 'campaignId2',
      campaignName: 'campaignName2',
      campaignType: 'campaignType2',
      CampaignSlug: 'slug',
      variationGroupId: 'variationGroupId2',
      variationGroupName: 'variationGroupName2',
      variation: {
        id: 'variationId2',
        name: 'variationName2',
        reference: true,
        modifications: {
          type: 'flag',
          value: { key2: 'value2' }
        }
      }
    }

    sessionStorageGetItemSpy.mockReturnValue(JSON.stringify(forcedVariations))

    loadQaAssistant(config)

    expect(window.flagship).toBeDefined()
    expect(window.flagship?.envId).toBe(config.envId)
    expect(window.flagship?.forcedVariations).toEqual(forcedVariations)
  })

  it('test loadQaAssistant JSON parsing throws an error', () => {
    sessionStorageGetItemSpy.mockReturnValue('error')

    loadQaAssistant(config)

    expect(window.flagship).toBeDefined()
    expect(window.flagship?.envId).toBe(config.envId)
    expect(window.flagship?.forcedVariations).toEqual({})
  })

  it('test loadQaAssistant addEventListener', () => {
    sessionStorageGetItemSpy.mockReturnValue('error')
    handleIframeMessageSpy.mockImplementation(() => {
      //
    })

     
    addEventListenerSpy.mockImplementation((type, listener:any) => {
      listener()
    })
    loadQaAssistant(config)

    expect(handleIframeMessageSpy).toBeCalledTimes(1)
  })

  it('test loadQaAssistant when QA has already launched', () => {
    sessionStorageGetItemSpy.mockReturnValue('error')
    window.frames.ABTastyQaAssistant = global.window || {}
    loadQaAssistant(config)

    expect(sessionStorageGetItemSpy).toBeCalledTimes(0)
    expect(addEventListenerSpy).toBeCalledTimes(0)
    expect(sessionStorageSetItemSpy).toBeCalledTimes(0)
    expect(appendScriptSpy).toBeCalledTimes(0)
  })
})
