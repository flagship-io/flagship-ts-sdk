import { IFlagshipConfig } from '../config/IFlagshipConfig.ts';
import { FS_FORCED_VARIATIONS } from '../enum/FlagshipConstant.ts';
import { VisitorVariationState } from '../type.local.ts';
import { logInfoSprintf } from '../utils/utils.ts';
import { loadQaAssistant } from './loadQaAssistant.ts';

/**
 *
 * @param config
 */
export function listenForKeyboardQaAssistant(config: IFlagshipConfig, visitorVariationState: VisitorVariationState):void {
  logInfoSprintf(config, 'QA assistant', 'Listening for keyboard events to launch QA Assistant');

  if (window.__flagshipSdkOnKeyCombinationDown) {
    document.removeEventListener('keydown', window.__flagshipSdkOnKeyCombinationDown);
  }

  if (window.__flagshipSdkOnKeyCombinationUp) {
    document.removeEventListener('keyup', window.__flagshipSdkOnKeyCombinationUp);
  }

  const keysPressed: Record<string, boolean> = {};

  const keyCombinationPressed = (): boolean => {
    return (keysPressed.Control || keysPressed.Alt) && keysPressed.q && keysPressed.a;
  };

  window.__flagshipSdkOnKeyCombinationDown = (event: KeyboardEvent):void => {
    keysPressed[event.key] = true;
    sessionStorage.removeItem(FS_FORCED_VARIATIONS);
    if (keyCombinationPressed()) {
      loadQaAssistant(config,null, visitorVariationState);
    }
  };

  window.__flagshipSdkOnKeyCombinationUp = (event: KeyboardEvent):void => {
    delete keysPressed[event.key];
  }
  ;

  document.addEventListener('keydown', window.__flagshipSdkOnKeyCombinationDown);
  document.addEventListener('keyup', window.__flagshipSdkOnKeyCombinationUp);

}
