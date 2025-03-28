/**
 * @jest-environment jsdom
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals'
import * as utils from '../../src/utils/utils'
import { launchQaAssistant } from '../../src/qaAssistant'
import * as loadQaAssistant from '../../src/qaAssistant/loadQaAssistant'
import * as listenForKeyboardQaAssistant from '../../src/qaAssistant/listenForKeyboardQaAssistant'
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig'
import { FS_QA_ASSISTANT, FS_QA_ASSISTANT_LOCAL, FS_QA_ASSISTANT_STAGING, QA_ASSISTANT_LOCAL_URL, QA_ASSISTANT_PROD_URL, QA_ASSISTANT_STAGING_URL } from '../../src/enum/FlagshipConstant'
describe('Qa Assistant', () => {
  const { location } = window
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser')
  const loadQaAssistantSpy = jest.spyOn(loadQaAssistant, 'loadQaAssistant')
  const listenForKeyboardQaAssistantSpy = jest.spyOn(listenForKeyboardQaAssistant, 'listenForKeyboardQaAssistant')
  const onDomReadySpy = jest.spyOn(utils, 'onDomReady')

  beforeEach(() => {
    isBrowserSpy.mockReturnValue(true)

    onDomReadySpy.mockImplementation((callback?: () => void): boolean => {
      callback?.()
      return true
    })

    loadQaAssistantSpy.mockImplementation(() => {
      //
    })
    listenForKeyboardQaAssistantSpy.mockImplementation(() => {
      //
    })
  })

  afterAll(() => {
    window.location = location as Location & string
  })

  it('test launchQaAssistant when environment is not a browser', () => {
    isBrowserSpy.mockReturnValue(false)
    const config = new DecisionApiConfig()
    config.isQAModeEnabled = true

    launchQaAssistant(config)
    expect(loadQaAssistantSpy).toBeCalledTimes(0)
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(0)
  })
  it('test launchQaAssistant when isQAModeEnabled is true', () => {
    const config = new DecisionApiConfig()
    config.isQAModeEnabled = true

    launchQaAssistant(config)
    expect(loadQaAssistantSpy).toBeCalledTimes(1)
    expect(loadQaAssistantSpy).toBeCalledWith(config, undefined)
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(0)
  })

  it('test launchQaAssistant when isQAModeEnabled is false ', () => {
    const config = new DecisionApiConfig()
    config.isQAModeEnabled = false

    launchQaAssistant(config)
    expect(loadQaAssistantSpy).toBeCalledTimes(0)
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(1)
    expect(listenForKeyboardQaAssistantSpy).toBeCalledWith(config)
  })

  it('test launchQaAssistant when when fs_qa_assistant is true ', () => {
    const config = new DecisionApiConfig()
    config.isQAModeEnabled = false

     
    delete (window as any).location
    window.location = { ...location, search: `?${FS_QA_ASSISTANT}=true` } as Location & string

    launchQaAssistant(config)
    expect(loadQaAssistantSpy).toBeCalledTimes(1)
    expect(loadQaAssistantSpy).toBeCalledWith(config, QA_ASSISTANT_PROD_URL)
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(0)
  })

  it('test launchQaAssistant when when fs_qa_assistant_staging is true ', () => {
    const config = new DecisionApiConfig()
    config.isQAModeEnabled = false

     
    delete (window as any).location
    window.location = { ...location, search: `?${FS_QA_ASSISTANT_STAGING}=true` } as Location & string

    launchQaAssistant(config)
    expect(loadQaAssistantSpy).toBeCalledTimes(1)
    expect(loadQaAssistantSpy).toBeCalledWith(config, QA_ASSISTANT_STAGING_URL)
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(0)
  })

  it('test launchQaAssistant when when fs_qa_assistant_local is true ', () => {
    const config = new DecisionApiConfig()
    config.isQAModeEnabled = false

     
    delete (window as any).location
    window.location = { ...location, search: `?${FS_QA_ASSISTANT_LOCAL}=true` } as Location & string

    launchQaAssistant(config)
    expect(loadQaAssistantSpy).toBeCalledTimes(1)
    expect(loadQaAssistantSpy).toBeCalledWith(config, QA_ASSISTANT_LOCAL_URL)
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(0)
  })

  it('test launchQaAssistant when when fs_qa_assistant is true ', () => {
    onDomReadySpy.mockImplementation((): boolean => {
      return false
    })

    const config = new DecisionApiConfig()
    config.isQAModeEnabled = false

     
    delete (window as any).location
    window.location = { ...location, search: `?${FS_QA_ASSISTANT}=true` } as Location & string

    launchQaAssistant(config)
    expect(loadQaAssistantSpy).toBeCalledTimes(0)
    expect(listenForKeyboardQaAssistantSpy).toBeCalledTimes(0)
  })
})
