/**
 * @jest-environment jsdom
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { handleIframeMessage } from '@src/qaAssistant/messages/handleIframeMessage'
import * as iframeMessageActions from '@src/qaAssistant/messages/iframeMessageActions'
import { EventDataFromIframe, MSG_NAME_FROM_IFRAME } from '@src/qaAssistant/type'
import { DecisionApiConfig } from '@src/config/DecisionApiConfig'
import * as utils from '@src/utils/utils'
import { FsVariationToForce } from '@src/types'

describe('Test handleIframeMessage', () => {
  beforeEach(() => {
    config.isQAModeEnabled = true
    isBrowserSpy.mockReturnValue(true)
  })
  const config = new DecisionApiConfig()
  config.envId = 'envId'
  const onQaAssistantReadySpy = jest.spyOn(iframeMessageActions, 'onQaAssistantReady')
  onQaAssistantReadySpy.mockImplementation(() => {
    //
  })
  const onQaAssistantCloseSpy = jest.spyOn(iframeMessageActions, 'onQaAssistantClose')
  onQaAssistantCloseSpy.mockImplementation(() => {
    //
  })
  const onApplyForcedVariationsSpy = jest.spyOn(iframeMessageActions, 'onApplyForcedVariations')
  onApplyForcedVariationsSpy.mockImplementation(() => {
    //
  })
  const onResetForcedVariationsSpy = jest.spyOn(iframeMessageActions, 'onResetForcedVariations')
  onResetForcedVariationsSpy.mockImplementation(() => {
    //
  })
  const render = jest.spyOn(iframeMessageActions, 'render')
  render.mockImplementation(() => {
    //
  })

  const isBrowserSpy = jest.spyOn(utils, 'isBrowser')

  it('test on QA assistant ready', () => {
    const event = new MessageEvent<EventDataFromIframe>('message', {
      data: {
        name: MSG_NAME_FROM_IFRAME.FsQaAssistantReady
      }
    })
    handleIframeMessage({ event, config })
    expect(onQaAssistantReadySpy).toBeCalledTimes(1)
  })

  it('test on QA assistant close', () => {
    const event = new MessageEvent<EventDataFromIframe>('message', {
      data: {
        name: MSG_NAME_FROM_IFRAME.QaAssistantClose
      }
    })
    handleIframeMessage({ event, config })
    expect(onQaAssistantCloseSpy).toBeCalledTimes(1)
    expect(onQaAssistantCloseSpy).toBeCalledWith(expect.objectContaining({ config }))
  })

  it('test on minimized QA assistant close', () => {
    const event = new MessageEvent<EventDataFromIframe>('message', {
      data: {
        name: MSG_NAME_FROM_IFRAME.MinimizeQaAssistantClose
      }
    })
    handleIframeMessage({ event, config })
    expect(onQaAssistantCloseSpy).toBeCalledTimes(1)
    expect(onQaAssistantCloseSpy).toBeCalledWith(expect.objectContaining({ config }))
  })

  it('test on apply forced variations', () => {
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

    const event = new MessageEvent<EventDataFromIframe>('message', {
      data: {
        name: MSG_NAME_FROM_IFRAME.FsApplyForcedVariations,
        value: forcedVariations
      }
    })
    handleIframeMessage({ event, config })
    expect(onApplyForcedVariationsSpy).toBeCalledTimes(1)
    expect(onApplyForcedVariationsSpy).toBeCalledWith({ value: forcedVariations })
  })

  it('test on reset forced variations', () => {
    const event = new MessageEvent<EventDataFromIframe>('message', {
      data: {
        name: MSG_NAME_FROM_IFRAME.FsResetForcedVariations
      }
    })
    handleIframeMessage({ event, config })
    expect(onResetForcedVariationsSpy).toBeCalledTimes(1)
    expect(onResetForcedVariationsSpy).toBeCalledWith()
  })

  it('test on trigger render', () => {
    const event = new MessageEvent<EventDataFromIframe>('message', {
      data: {
        name: MSG_NAME_FROM_IFRAME.FsTriggerRender
      }
    })
    handleIframeMessage({ event, config })
    expect(render).toBeCalledTimes(1)
  })

  it('test environment is not browser', () => {
    isBrowserSpy.mockReturnValue(false)
    const event = new MessageEvent<EventDataFromIframe>('message', {
      data: {
        name: MSG_NAME_FROM_IFRAME.FsResetForcedVariations
      }
    })
    handleIframeMessage({ event, config })
    expect(onResetForcedVariationsSpy).toBeCalledTimes(0)
  })

  it('test QA mode is not activated', () => {
    config.isQAModeEnabled = false
    const event = new MessageEvent<EventDataFromIframe>('message', {
      data: {
        name: MSG_NAME_FROM_IFRAME.FsResetForcedVariations
      }
    })
    handleIframeMessage({ event, config })
    expect(onResetForcedVariationsSpy).toBeCalledTimes(0)
  })
})
