/**
 * @jest-environment jsdom
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import * as messages from '../../../src/qaAssistant/messages'
import { onQaAssistantReady, render, onQaAssistantClose, onApplyForcedVariations, onResetForcedVariations } from '../../../src/qaAssistant/messages/iframeMessageActions'
import { EventDataFromIframe } from '../../../src/qaAssistant/type'
import { DecisionApiConfig } from '../../../src/config/DecisionApiConfig'
import { FsVariationToForce, VisitorVariations } from '../../../src/types'
import { FS_FORCED_VARIATIONS, FS_IS_QA_MODE_ENABLED, FS_QA_ASSISTANT_SCRIPT_TAG_ID } from '../../../src/enum/FlagshipConstant'

describe('Test iframeMessageActions', () => {
  beforeEach(() => {
    config.isQAModeEnabled = true
  })
  const config = new DecisionApiConfig()
  config.envId = 'envId'

  const sendVisitorAllocatedVariationsSpy = jest.spyOn(messages, 'sendVisitorAllocatedVariations')
  sendVisitorAllocatedVariationsSpy.mockImplementation(() => {
    //
  })
  const sendVisitorExposedVariationsSpy = jest.spyOn(messages, 'sendVisitorExposedVariations')
  sendVisitorExposedVariationsSpy.mockImplementation(() => {
    //
  })

  const dispatchEventSpy = jest.spyOn(global.window, 'dispatchEvent')

  const removeItemSpy = jest.spyOn(Object.getPrototypeOf(sessionStorage), 'removeItem')
  const setItemSpy = jest.spyOn(Object.getPrototypeOf(sessionStorage), 'setItem')
  const getItemSpy = jest.spyOn(Object.getPrototypeOf(sessionStorage), 'getItem')
  const removeEventListenerSpy = jest.spyOn(global.window, 'removeEventListener')
  //   const reloadSpy = jest.spyOn(global.window.location, 'reload')

  // const reloadSpy = jest.fn()

  it('test onQaAssistantReady when VisitorVariations or VisitorVariations is null ', () => {
    onQaAssistantReady()
    expect(sendVisitorAllocatedVariationsSpy).toBeCalledTimes(0)
    expect(sendVisitorExposedVariationsSpy).toBeCalledTimes(0)
  })
  it('test onQaAssistantReady', () => {
    const visitorVariations:Record<string, VisitorVariations> = {
      key: {} as VisitorVariations
    }
    const exposedVariations:Record<string, VisitorVariations> = {
      key: {} as VisitorVariations
    }
    global.window.flagship = {
      visitorVariations,
      exposedVariations
    }

    onQaAssistantReady()

    expect(sendVisitorAllocatedVariationsSpy).toBeCalledTimes(1)
    expect(sendVisitorExposedVariationsSpy).toBeCalledTimes(1)
    expect(sendVisitorAllocatedVariationsSpy).toBeCalledWith(visitorVariations)
    expect(sendVisitorExposedVariationsSpy).toBeCalledWith(exposedVariations)
  })

  it('test render', () => {
    dispatchEventSpy.mockImplementationOnce(() => {
      return true
    })

    render()

    // expect(reloadSpy).toBeCalledTimes(1)
    expect(dispatchEventSpy).toBeCalledTimes(1)
  })

  it('test onQaAssistantClose', () => {
    const fn = jest.fn<(event: MessageEvent<EventDataFromIframe>) => void>()
    const element = document.createElement('script')
    element.id = FS_QA_ASSISTANT_SCRIPT_TAG_ID
    document.body.append(element)
    expect(document.getElementById(FS_QA_ASSISTANT_SCRIPT_TAG_ID)).toBeDefined()

    onQaAssistantClose({ config, func: fn })

    expect(removeItemSpy).toBeCalledTimes(1)
    expect(removeItemSpy).toBeCalledWith(FS_IS_QA_MODE_ENABLED)
    expect(removeEventListenerSpy).toBeCalledTimes(1)
    expect(removeEventListenerSpy).toBeCalledWith('message', fn)
    expect(document.getElementById(FS_QA_ASSISTANT_SCRIPT_TAG_ID)).toBeNull()
    expect(global?.window?.flagship?.forcedVariations).toEqual({})
    expect(dispatchEventSpy).toBeCalledTimes(1)
    expect(config.isQAModeEnabled).toBeFalsy()
  })

  it('test onApplyForcedVariations', () => {
    const forcedVariations:Record<string, FsVariationToForce> = {
      campaignId: {
        campaignId: 'campaignId',
        campaignName: 'campaignName',
        campaignType: 'campaignType',
        CampaignSlug: 'CampaignSlug',
        variationGroupId: 'variationGroupId',
        variationGroupName: 'variationGroupName',
        variation: {
          id: 'variationId',
          modifications: {
            type: 'flag',
            value: {
              key: 'value'
            }
          }
        }
      }
    }
    onApplyForcedVariations({ value: forcedVariations })

    expect(setItemSpy).toBeCalledTimes(1)
    expect(setItemSpy).toBeCalledWith(FS_FORCED_VARIATIONS, JSON.stringify(forcedVariations))
    expect(global?.window?.flagship?.forcedVariations).toEqual(forcedVariations)
    expect(dispatchEventSpy).toBeCalledTimes(1)
  })

  it('test onApplyForcedVariations with from session storage', () => {
    const forcedVariations:Record<string, FsVariationToForce> = {
      campaignId: {
        campaignId: 'campaignId',
        campaignName: 'campaignName',
        campaignType: 'campaignType',
        CampaignSlug: 'CampaignSlug',
        variationGroupId: 'variationGroupId',
        variationGroupName: 'variationGroupName',
        variation: {
          id: 'variationId',
          modifications: {
            type: 'flag',
            value: {
              key: 'value'
            }
          }
        }
      }
    }
    const storedForcedVariations:Record<string, FsVariationToForce> = {
      campaignId2: {
        campaignId: 'campaignId2',
        campaignName: 'campaignName2',
        campaignType: 'campaignType2',
        CampaignSlug: 'CampaignSlug2',
        variationGroupId: 'variationGroupId2',
        variationGroupName: 'variationGroupName2',
        variation: {
          id: 'variationId2',
          modifications: {
            type: 'flag2',
            value: {
              key: 'value2'
            }
          }
        }
      }
    }
    getItemSpy.mockReturnValue(JSON.stringify(storedForcedVariations))
    onApplyForcedVariations({ value: forcedVariations })

    const newForcesVariations = { ...storedForcedVariations, ...forcedVariations }
    expect(setItemSpy).toBeCalledTimes(1)
    expect(setItemSpy).toBeCalledWith(FS_FORCED_VARIATIONS, JSON.stringify(newForcesVariations))
    expect(global?.window?.flagship?.forcedVariations).toEqual(newForcesVariations)
    expect(dispatchEventSpy).toBeCalledTimes(1)
  })

  it('test onApplyForcedVariations JSON parsing throw error', () => {
    const forcedVariations:Record<string, FsVariationToForce> = {
      campaignId: {
        campaignId: 'campaignId',
        campaignName: 'campaignName',
        campaignType: 'campaignType',
        CampaignSlug: 'CampaignSlug',
        variationGroupId: 'variationGroupId',
        variationGroupName: 'variationGroupName',
        variation: {
          id: 'variationId',
          modifications: {
            type: 'flag',
            value: {
              key: 'value'
            }
          }
        }
      }
    }

    getItemSpy.mockReturnValue('error')
    onApplyForcedVariations({ value: forcedVariations })

    expect(setItemSpy).toBeCalledTimes(1)
    expect(setItemSpy).toBeCalledWith(FS_FORCED_VARIATIONS, JSON.stringify(forcedVariations))
    expect(global?.window?.flagship?.forcedVariations).toEqual(forcedVariations)
    expect(dispatchEventSpy).toBeCalledTimes(1)
  })

  it('test onApplyForcedVariations JSON parsing throw error', () => {
    onResetForcedVariations()

    expect(global?.window?.flagship?.forcedVariations).toEqual({})
    expect(removeItemSpy).toBeCalledWith(FS_FORCED_VARIATIONS)
    expect(dispatchEventSpy).toBeCalledTimes(1)
  })
})
