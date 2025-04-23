import { IFlagshipConfig } from '../config/IFlagshipConfig';
import { FS_FORCED_VARIATIONS } from '../enum/FlagshipConstant';
import { VisitorVariationState } from '../type.local';
import { logInfoSprintf } from '../utils/utils';
import { loadQaAssistant } from './loadQaAssistant';

/**
 *
 * @param config
 */
export function listenForKeyboardQaAssistant(config: IFlagshipConfig, visitorVariationState: VisitorVariationState):void {
  logInfoSprintf(config, 'QA assistant', 'Listening for keyboard events to launch QA Assistant');

  const keysPressed: Record<string, boolean> = {};

  const keyCombinationPressed = (): boolean => {
    return (keysPressed.Control || keysPressed.Alt) && keysPressed.q && keysPressed.a;
  };

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    keysPressed[event.key] = true;
    sessionStorage.removeItem(FS_FORCED_VARIATIONS);
    if (keyCombinationPressed()) {
      loadQaAssistant(config,null, visitorVariationState);
    }
  });

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    delete keysPressed[event.key];
  });
}
