import { jest, describe, beforeEach, it, expect } from '@jest/globals'
import * as utils from '../../src/utils/utils'
import { launchQaAssistant } from '../../src/qaAssistant'
import { DecisionApiConfig } from '../../src/mod'
import * as loadQaAssistant from '../../src/qaAssistant/loadQaAssistant'
import * as listenForKeyboardQaAssistant from '../../src/qaAssistant/listenForKeyboardQaAssistant'
describe('Qa Assistant', () => {
  beforeEach(() => {
    isBrowserSpy.mockReturnValue(true)

    loadQaAssistantSpy.mockImplementation(() => {
      //
    })
    listenForKeyboardQaAssistantSpy.mockImplementation(() => {
      //
    })
  })

  const isBrowserSpy = jest.spyOn(utils, 'isBrowser')
  const loadQaAssistantSpy = jest.spyOn(loadQaAssistant, 'loadQaAssistant')
  const listenForKeyboardQaAssistantSpy = jest.spyOn(listenForKeyboardQaAssistant, 'listenForKeyboardQaAssistant')

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
    expect(loadQaAssistantSpy).toBeCalledWith(config)
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
})
