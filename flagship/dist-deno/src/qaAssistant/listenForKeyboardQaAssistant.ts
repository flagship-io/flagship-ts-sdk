import { IFlagshipConfig } from '../config/IFlagshipConfig.ts'
import { FS_FORCED_VARIATIONS } from '../enum/FlagshipConstant.ts'
import { logInfoSprintf } from '../utils/utils.ts'
import { loadQaAssistant } from './loadQaAssistant.ts'

/**
 *
 * @param config
 */
export function listenForKeyboardQaAssistant (config: IFlagshipConfig):void {
  logInfoSprintf(config, 'QA assistant', 'Listening for keyboard events to launch QA Assistant')

  const keysPressed: Record<string, boolean> = {}

  const keyCombinationPressed = (): boolean => {
    return (keysPressed.Control || keysPressed.Alt) && keysPressed.q && keysPressed.a
  }

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    keysPressed[event.key] = true
    sessionStorage.removeItem(FS_FORCED_VARIATIONS)
    if (keyCombinationPressed()) {
      loadQaAssistant(config)
    }
  })

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    delete keysPressed[event.key]
  })
}
