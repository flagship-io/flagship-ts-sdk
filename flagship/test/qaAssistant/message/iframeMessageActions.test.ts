/**
 * @jest-environment jsdom
 */

import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import * as messages from '../../../src/qaAssistant/messages';
import { onQaAssistantReady, render, onQaAssistantClose, onApplyForcedVariations, onResetForcedVariations } from '../../../src/qaAssistant/messages/iframeMessageActions';
import { EventDataFromIframe } from '../../../src/qaAssistant/type';
import { DecisionApiConfig } from '../../../src/config/DecisionApiConfig';
import { FsVariationToForce, VisitorVariations } from '../../../src/types';
import { FS_FORCED_VARIATIONS, FS_IS_QA_MODE_ENABLED, FS_QA_ASSISTANT_SCRIPT_TAG_ID } from '../../../src/enum/FlagshipConstant';
import { VisitorVariationState } from '../../../src/type.local';

describe('QA Assistant Message Actions', () => {
  const reloadMock = jest.fn();
  const originalLocation = window.location;

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock }
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation
    });
  });

  beforeEach(() => {
    config.isQAModeEnabled = true;
  });
  const config = new DecisionApiConfig();
  config.envId = 'envId';

  const sendVisitorAllocatedVariationsSpy = jest.spyOn(messages, 'sendVisitorAllocatedVariations');
  sendVisitorAllocatedVariationsSpy.mockImplementation(() => {
    //
  });
  const sendVisitorExposedVariationsSpy = jest.spyOn(messages, 'sendVisitorExposedVariations');
  sendVisitorExposedVariationsSpy.mockImplementation(() => {
    //
  });

  const dispatchEventSpy = jest.spyOn(global.window, 'dispatchEvent');

  const removeItemSpy = jest.spyOn(Object.getPrototypeOf(sessionStorage), 'removeItem');
  const setItemSpy = jest.spyOn(Object.getPrototypeOf(sessionStorage), 'setItem');
  const getItemSpy = jest.spyOn(Object.getPrototypeOf(sessionStorage), 'getItem');
  const removeEventListenerSpy = jest.spyOn(global.window, 'removeEventListener');
  const visitorVariationState: VisitorVariationState = {};

  it('should not send variations when visitor variations are undefined', () => {
    onQaAssistantReady(visitorVariationState);
    expect(sendVisitorAllocatedVariationsSpy).toBeCalledTimes(0);
    expect(sendVisitorExposedVariationsSpy).toBeCalledTimes(0);
  });

  it('should send allocated and exposed variations when they exist', () => {
    const visitorVariations:Record<string, VisitorVariations> = { key: {} as VisitorVariations };
    const exposedVariations:Record<string, VisitorVariations> = { key: {} as VisitorVariations };

    visitorVariationState.exposedVariations = exposedVariations;
    visitorVariationState.visitorVariations = visitorVariations;

    onQaAssistantReady(visitorVariationState);

    expect(sendVisitorAllocatedVariationsSpy).toBeCalledTimes(1);
    expect(sendVisitorExposedVariationsSpy).toBeCalledTimes(1);
    expect(sendVisitorAllocatedVariationsSpy).toBeCalledWith(visitorVariationState);
    expect(sendVisitorExposedVariationsSpy).toBeCalledWith(visitorVariationState);
  });

  it('should dispatch event when rendering QA assistant', () => {
    dispatchEventSpy.mockImplementationOnce(() => {
      return true;
    });

    render();

    expect(dispatchEventSpy).toBeCalledTimes(1);
  });

  it('should clean up DOM, storage and events when QA assistant is closed', () => {
    const fn = jest.fn<(event: MessageEvent<EventDataFromIframe>) => void>();
    const element = document.createElement('script');
    element.id = FS_QA_ASSISTANT_SCRIPT_TAG_ID;
    document.body.append(element);
    expect(document.getElementById(FS_QA_ASSISTANT_SCRIPT_TAG_ID)).toBeDefined();

    onQaAssistantClose({
      config,
      func: fn,
      visitorVariationState
    });

    expect(removeItemSpy).toBeCalledTimes(1);
    expect(removeItemSpy).toBeCalledWith(FS_IS_QA_MODE_ENABLED);
    expect(removeEventListenerSpy).toBeCalledTimes(1);
    expect(removeEventListenerSpy).toBeCalledWith('message', fn);
    expect(document.getElementById(FS_QA_ASSISTANT_SCRIPT_TAG_ID)).toBeNull();
    expect(visitorVariationState?.forcedVariations).toEqual({});
    expect(dispatchEventSpy).toBeCalledTimes(1);
    expect(config.isQAModeEnabled).toBeFalsy();
  });

  it('should store and apply forced variations', () => {
    const forcedVariations:Record<string, FsVariationToForce> = {
      campaignId: {
        campaignId: 'campaignId',
        campaignName: 'campaignName',
        campaignType: 'campaignType',
        CampaignSlug: 'CampaignSlug',
        variationGroupId: 'variationGroupId',
        variationGroupName: 'variationGroupName',
        variation: {
          id: 'variationId',
          modifications: {
            type: 'flag',
            value: { key: 'value' }
          }
        }
      }
    };
    onApplyForcedVariations({
      value: forcedVariations,
      visitorVariationState
    });

    expect(setItemSpy).toBeCalledTimes(1);
    expect(setItemSpy).toBeCalledWith(FS_FORCED_VARIATIONS, JSON.stringify(forcedVariations));
    expect(visitorVariationState.forcedVariations).toEqual(forcedVariations);
    expect(dispatchEventSpy).toBeCalledTimes(1);
  });

  it('should merge new forced variations with existing ones from session storage', () => {
    const forcedVariations:Record<string, FsVariationToForce> = {
      campaignId: {
        campaignId: 'campaignId',
        campaignName: 'campaignName',
        campaignType: 'campaignType',
        CampaignSlug: 'CampaignSlug',
        variationGroupId: 'variationGroupId',
        variationGroupName: 'variationGroupName',
        variation: {
          id: 'variationId',
          modifications: {
            type: 'flag',
            value: { key: 'value' }
          }
        }
      }
    };
    const storedForcedVariations:Record<string, FsVariationToForce> = {
      campaignId2: {
        campaignId: 'campaignId2',
        campaignName: 'campaignName2',
        campaignType: 'campaignType2',
        CampaignSlug: 'CampaignSlug2',
        variationGroupId: 'variationGroupId2',
        variationGroupName: 'variationGroupName2',
        variation: {
          id: 'variationId2',
          modifications: {
            type: 'flag2',
            value: { key: 'value2' }
          }
        }
      }
    };
    getItemSpy.mockReturnValue(JSON.stringify(storedForcedVariations));
    onApplyForcedVariations({
      value: forcedVariations,
      visitorVariationState
    });

    const newForcesVariations = {
      ...storedForcedVariations,
      ...forcedVariations
    };
    expect(setItemSpy).toBeCalledTimes(1);
    expect(setItemSpy).toBeCalledWith(FS_FORCED_VARIATIONS, JSON.stringify(newForcesVariations));
    expect(visitorVariationState?.forcedVariations).toEqual(newForcesVariations);
    expect(dispatchEventSpy).toBeCalledTimes(1);
  });

  it('should handle JSON parsing errors when reading from session storage', () => {
    const forcedVariations:Record<string, FsVariationToForce> = {
      campaignId: {
        campaignId: 'campaignId',
        campaignName: 'campaignName',
        campaignType: 'campaignType',
        CampaignSlug: 'CampaignSlug',
        variationGroupId: 'variationGroupId',
        variationGroupName: 'variationGroupName',
        variation: {
          id: 'variationId',
          modifications: {
            type: 'flag',
            value: { key: 'value' }
          }
        }
      }
    };

    getItemSpy.mockReturnValue('error');
    onApplyForcedVariations({
      value: forcedVariations,
      visitorVariationState
    });

    expect(setItemSpy).toBeCalledTimes(1);
    expect(setItemSpy).toBeCalledWith(FS_FORCED_VARIATIONS, JSON.stringify(forcedVariations));
    expect(visitorVariationState?.forcedVariations).toEqual(forcedVariations);
    expect(dispatchEventSpy).toBeCalledTimes(1);
  });

  it('should reset forced variations and clean up storage', () => {
    onResetForcedVariations(visitorVariationState);

    expect(visitorVariationState?.forcedVariations).toEqual({});
    expect(removeItemSpy).toBeCalledWith(FS_FORCED_VARIATIONS);
    expect(dispatchEventSpy).toBeCalledTimes(1);
  });
});
