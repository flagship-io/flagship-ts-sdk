import { IFlagshipConfig } from '../config/IFlagshipConfig';
import { FS_FORCED_VARIATIONS } from '../enum/FlagshipConstant';
import { logInfoSprintf } from '../utils/utils';
import { loadQaAssistant } from './loadQaAssistant';

/**
 *
 * @param config
 */
export function listenForKeyboardQaAssistant(config: IFlagshipConfig):void {
  logInfoSprintf(config, 'QA assistant', 'Listening for keyboard events to launch QA Assistant');

  const keysPressed: Record<string, boolean> = {};

  const keyCombinationPressed = (): boolean => {
    return (keysPressed.Control || keysPressed.Alt) && keysPressed.q && keysPressed.a;
  };

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    keysPressed[event.key] = true;
    sessionStorage.removeItem(FS_FORCED_VARIATIONS);
    if (keyCombinationPressed()) {
      loadQaAssistant(config);
    }
  });

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    delete keysPressed[event.key];
  });
}
