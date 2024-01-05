/**
 * @jest-environment jsdom
 */

import { jest, describe, it, expect } from '@jest/globals'
import { handleIframeMessage } from '../../../src/qaAssistant/messages/handleIframeMessage'
import * as iframeMessageActions from '../../../src/qaAssistant/messages/iframeMessageActions'
import { EventDataFromIframe, MSG_NAME_FROM_IFRAME } from '../../../src/qaAssistant/type'
import { DecisionApiConfig } from '@src/config/DecisionApiConfig'

describe('Test appendScript', () => {
  const config = new DecisionApiConfig()
  config.envId = 'envId'
  const onQaAssistantReadySpy = jest.spyOn(iframeMessageActions, 'onQaAssistantReady')
  it('test Script is appended to document', () => {
    const event = new MessageEvent<EventDataFromIframe>('message', {
      data: {
        name: MSG_NAME_FROM_IFRAME.FsQaAssistantReady
      }
    })
    handleIframeMessage({ event, config })
  })
})
∏