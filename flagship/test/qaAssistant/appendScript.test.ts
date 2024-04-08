/**
 * @jest-environment jsdom
 */

import { describe, it, expect } from '@jest/globals'
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig'
import { appendScript } from '../../src/qaAssistant/appendScript'
import { FS_QA_ASSISTANT_SCRIPT_TAG_ID, QA_ASSISTANT_URL } from '../../src/enum/FlagshipConstant'

describe('Test appendScript', () => {
  const config = new DecisionApiConfig()
  config.envId = 'envId'

  it('test Script is appended to document', () => {
    appendScript(QA_ASSISTANT_URL)

    const tagScript = document.getElementById(FS_QA_ASSISTANT_SCRIPT_TAG_ID) as HTMLScriptElement|null
    expect(tagScript).toBeDefined()
    expect(tagScript?.src).toBe(QA_ASSISTANT_URL)
    expect(tagScript).toMatchSnapshot()
  })
})
