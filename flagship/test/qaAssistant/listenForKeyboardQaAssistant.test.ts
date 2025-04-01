/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DecisionApiConfig } from '../../src/config/DecisionApiConfig';
import { listenForKeyboardQaAssistant } from '../../src/qaAssistant/listenForKeyboardQaAssistant';
import * as loadQaAssistant from '../../src/qaAssistant/loadQaAssistant';
import userEvent from '@testing-library/user-event';

describe('Test Listen for keyboard', () => {
  const config = new DecisionApiConfig();
  config.envId = 'envId';
  beforeEach(() => {
    loadQaAssistantSpy.mockImplementation(() => {
      //
    });
    loadQaAssistantSpy.mockReset();
  });
  const loadQaAssistantSpy = jest.spyOn(loadQaAssistant, 'loadQaAssistant');
  it('test listen for keyboard scenarios', async () => {
    listenForKeyboardQaAssistant(config);
    await userEvent.keyboard('{Control}{q}{a}');
    expect(loadQaAssistantSpy).toBeCalledTimes(0);

    expect(loadQaAssistantSpy).toBeCalledTimes(0);
    await userEvent.keyboard('{Control}{a}');
    expect(loadQaAssistantSpy).toBeCalledTimes(0);
    await userEvent.keyboard('{v}{a}');
    await userEvent.keyboard('{Control>}{q}{a}');
    expect(loadQaAssistantSpy).toBeCalledTimes(0);
    await userEvent.keyboard('{Control>}{q>}{a}');
    expect(loadQaAssistantSpy).toBeCalledTimes(1);
    await userEvent.keyboard('{Control>}{q>}{a>}{/Control}{/q}{/a}');
    expect(loadQaAssistantSpy).toBeCalledTimes(2);
  });
});
