import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { FS_IS_QA_MODE_ENABLED } from '../enum/FlagshipConstant'
import { isBrowser, logInfoSprintf } from '../utils/utils'
import { handleIframeMessage } from './handleIframeMessage'
import { EventDataFromIframe } from './type'

/**
 *
 * @param bundleFileUrl
 */
function appendScript (bundleFileUrl: string): void {
  const script = document.createElement('script')
  script.src = bundleFileUrl
  document.body.append(script)
}

/**
 *
 * @param config
 * @returns
 */
function loadQaAssistant (config: IFlagshipConfig): void {
  if (window.frames.ABTastyQaAssistant) {
    return
  }

  window.addEventListener('message', (event: MessageEvent<EventDataFromIframe>) => {
    handleIframeMessage({ event, config })
  })

  logInfoSprintf(config, 'QA assistant', 'Loading QA Assistant')
  //   const bundleFileUrl = 'https://qa-assistant.abtasty.com/bundle.js'
  const bundleFileUrl = 'https://127.0.0.1:5000/bundle.js'
  appendScript(bundleFileUrl)
  window.flagship = {
    envId: config.envId as string
  }

  config.isQAModeEnabled = true
  sessionStorage.setItem(FS_IS_QA_MODE_ENABLED, 'true')
}

/**
 *
 * @param config
 */
function listenForKeyboardQaAssistant (config: IFlagshipConfig) {
  logInfoSprintf(config, 'QA assistant', 'Listening for keyboard events to launch QA Assistant')

  const keysPressed: Record<string, boolean> = {}

  const keyCombinationPressed = (): boolean => {
    return (keysPressed.Control || keysPressed.Alt) && keysPressed.q && keysPressed.a
  }

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    keysPressed[event.key] = true
    if (keyCombinationPressed()) {
      loadQaAssistant(config)
    }
  })

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    delete keysPressed[event.key]
  })
}

/**
 *
 * @param config
 * @returns
 */
export function launchQaAssistant (config: IFlagshipConfig): void {
  if (!isBrowser()) {
    return
  }
  if (config.isQAModeEnabled) {
    loadQaAssistant(config)
    return
  }
  listenForKeyboardQaAssistant(config)
}
