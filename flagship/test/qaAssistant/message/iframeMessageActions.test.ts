/**
 * @jest-environment jsdom
 */

import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import * as messages from '../../../src/qaAssistant/web/messages';
import { onQaAssistantReady, render, onQaAssistantClose, onApplyForcedVariations, onResetForcedVariations, onRemoveForcedVariation, onVariationsForcedAllocation, onVariationsForcedUnallocation } from '../../../src/qaAssistant/web/messages/iframeMessageActions';
import { EventDataFromIframe, INTERNAL_EVENTS } from '../../../src/qaAssistant/web/type';
import { DecisionApiConfig } from '../../../src/config/DecisionApiConfig';
import { FsVariationToForce, VisitorVariations } from '../../../src/types';
import { FS_FORCED_VARIATIONS, FS_IS_QA_MODE_ENABLED, FS_QA_ASSISTANT_SCRIPT_TAG_ID, FS_VARIATIONS_FORCED_ALLOCATION, FS_VARIATIONS_FORCED_UNALLOCATION, SDK_INFO } from '../../../src/enum/FlagshipConstant';
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

  it('should remove forced variation keys and trigger render', () => {
    const existingForcedVariations: Record<string, FsVariationToForce> = {
      campaignId1: {
        campaignId: 'campaignId1',
        campaignName: 'campaignName1',
        campaignType: 'campaignType1',
        CampaignSlug: 'CampaignSlug1',
        variationGroupId: 'variationGroupId1',
        variationGroupName: 'variationGroupName1',
        variation: {
          id: 'variationId1',
          modifications: {
            type: 'flag',
            value: { key: 'value1' }
          }
        }
      },
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
            type: 'flag',
            value: { key: 'value2' }
          }
        }
      },
      campaignId3: {
        campaignId: 'campaignId3',
        campaignName: 'campaignName3',
        campaignType: 'campaignType3',
        CampaignSlug: 'CampaignSlug3',
        variationGroupId: 'variationGroupId3',
        variationGroupName: 'variationGroupName3',
        variation: {
          id: 'variationId3',
          modifications: {
            type: 'flag',
            value: { key: 'value3' }
          }
        }
      }
    };

    getItemSpy.mockReturnValue(JSON.stringify(existingForcedVariations));

    onRemoveForcedVariation({
      keys: ['campaignId1', 'campaignId3'],
      visitorVariationState
    });

    const expectedVariations = { campaignId2: existingForcedVariations.campaignId2 };

    expect(setItemSpy).toBeCalledWith(FS_FORCED_VARIATIONS, JSON.stringify(expectedVariations));
    expect(visitorVariationState.forcedVariations).toEqual(expectedVariations);
  });

  it('should handle removing non-existent keys gracefully', () => {
    const existingForcedVariations: Record<string, FsVariationToForce> = {
      campaignId1: {
        campaignId: 'campaignId1',
        campaignName: 'campaignName1',
        campaignType: 'campaignType1',
        CampaignSlug: 'CampaignSlug1',
        variationGroupId: 'variationGroupId1',
        variationGroupName: 'variationGroupName1',
        variation: {
          id: 'variationId1',
          modifications: {
            type: 'flag',
            value: { key: 'value1' }
          }
        }
      }
    };

    getItemSpy.mockReturnValue(JSON.stringify(existingForcedVariations));

    onRemoveForcedVariation({
      keys: ['nonExistentKey'],
      visitorVariationState
    });

    expect(setItemSpy).toBeCalledWith(FS_FORCED_VARIATIONS, JSON.stringify(existingForcedVariations));
    expect(visitorVariationState.forcedVariations).toEqual(existingForcedVariations);
  });

  it('should handle JSON parsing errors when removing forced variations', () => {
    getItemSpy.mockReturnValue('invalid json');

    onRemoveForcedVariation({
      keys: ['campaignId1'],
      visitorVariationState
    });

    expect(setItemSpy).toBeCalledWith(FS_FORCED_VARIATIONS, JSON.stringify({}));
    expect(visitorVariationState.forcedVariations).toEqual({});
  });

  it('should store variations forced allocation and update state', () => {
    const forcedAllocation: Record<string, FsVariationToForce> = {
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

    getItemSpy.mockReturnValue(JSON.stringify({}));

    onVariationsForcedAllocation({
      value: forcedAllocation,
      visitorVariationState
    });

    expect(setItemSpy).toBeCalledWith(FS_VARIATIONS_FORCED_ALLOCATION, JSON.stringify(forcedAllocation));
    expect(visitorVariationState.variationsForcedAllocation).toEqual(forcedAllocation);
    expect(visitorVariationState.shouldForceRender).toBe(true);
    expect(dispatchEventSpy).toBeCalledTimes(1);
  });

  it('should remove diff variation keys when updating forced allocation', () => {
    const existingAllocation: Record<string, FsVariationToForce> = {
      campaignId1: {
        campaignId: 'campaignId1',
        campaignName: 'campaignName1',
        campaignType: 'campaignType1',
        CampaignSlug: 'CampaignSlug1',
        variationGroupId: 'variationGroupId1',
        variationGroupName: 'variationGroupName1',
        variation: {
          id: 'variationId1',
          modifications: {
            type: 'flag',
            value: { key: 'value1' }
          }
        }
      },
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
            type: 'flag',
            value: { key: 'value2' }
          }
        }
      }
    };

    const newAllocation: Record<string, FsVariationToForce> = {
      campaignId2: existingAllocation.campaignId2,
      campaignId3: {
        campaignId: 'campaignId3',
        campaignName: 'campaignName3',
        campaignType: 'campaignType3',
        CampaignSlug: 'CampaignSlug3',
        variationGroupId: 'variationGroupId3',
        variationGroupName: 'variationGroupName3',
        variation: {
          id: 'variationId3',
          modifications: {
            type: 'flag',
            value: { key: 'value3' }
          }
        }
      }
    };

    visitorVariationState.variationsForcedAllocation = existingAllocation;
    getItemSpy.mockReturnValue(JSON.stringify({
      campaignId1: existingAllocation.campaignId1,
      campaignId2: existingAllocation.campaignId2
    }));

    onVariationsForcedAllocation({
      value: newAllocation,
      visitorVariationState
    });

    expect(setItemSpy).toBeCalledTimes(2);

    expect(setItemSpy).toHaveBeenNthCalledWith(1,FS_VARIATIONS_FORCED_ALLOCATION, JSON.stringify(newAllocation));
    expect(visitorVariationState.variationsForcedAllocation).toEqual(newAllocation);

    expect(setItemSpy).toHaveBeenNthCalledWith(2, FS_FORCED_VARIATIONS, JSON.stringify({ campaignId2: existingAllocation.campaignId2 }));
    expect(visitorVariationState.forcedVariations).toEqual({ campaignId2: existingAllocation.campaignId2 });
  });

  it('should handle empty variations forced allocation', () => {
    visitorVariationState.variationsForcedAllocation = {};
    getItemSpy.mockReturnValue(JSON.stringify({}));

    onVariationsForcedAllocation({
      value: {},
      visitorVariationState
    });

    expect(setItemSpy).toBeCalledWith(FS_VARIATIONS_FORCED_ALLOCATION, JSON.stringify({}));
    expect(visitorVariationState.variationsForcedAllocation).toEqual({});
    expect(visitorVariationState.shouldForceRender).toBe(true);
  });

  it('should store variations forced unallocation and update state', () => {
    const forcedUnallocation: Record<string, FsVariationToForce> = {
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

    onVariationsForcedUnallocation({
      value: forcedUnallocation,
      visitorVariationState
    });

    expect(setItemSpy).toBeCalledWith(FS_VARIATIONS_FORCED_UNALLOCATION, JSON.stringify(forcedUnallocation));
    expect(visitorVariationState.variationsForcedUnallocation).toEqual(forcedUnallocation);
    expect(visitorVariationState.shouldForceRender).toBe(true);
    expect(dispatchEventSpy).toBeCalledTimes(1);
  });

  it('should handle empty variations forced unallocation', () => {
    onVariationsForcedUnallocation({
      value: {},
      visitorVariationState
    });

    expect(setItemSpy).toBeCalledWith(FS_VARIATIONS_FORCED_UNALLOCATION, JSON.stringify({}));
    expect(visitorVariationState.variationsForcedUnallocation).toEqual({});
    expect(visitorVariationState.shouldForceRender).toBe(true);
  });

  describe('render function', () => {
    let originalSDKInfo: any;

    beforeAll(() => {
      originalSDKInfo = { ...SDK_INFO };
    });

    afterEach(() => {
      Object.assign(SDK_INFO, originalSDKInfo);
    });

    it('should dispatch custom event with forcedReFetchFlags as false by default', () => {
      SDK_INFO.name = 'ReactJS';
      dispatchEventSpy.mockClear();

      render();

      expect(dispatchEventSpy).toBeCalledTimes(1);
      const dispatchedEvent = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(dispatchedEvent.type).toBe(INTERNAL_EVENTS.FsTriggerRendering);
      expect(dispatchedEvent.detail).toEqual({ forcedReFetchFlags: false });
    });

    it('should dispatch custom event with forcedReFetchFlags as true when specified', () => {
      SDK_INFO.name = 'ReactJS';
      dispatchEventSpy.mockClear();

      render(true);

      expect(dispatchEventSpy).toBeCalledTimes(1);
      const dispatchedEvent = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(dispatchedEvent.type).toBe(INTERNAL_EVENTS.FsTriggerRendering);
      expect(dispatchedEvent.detail).toEqual({ forcedReFetchFlags: true });
    });

    it('should call window.location.reload when SDK name is TypeScript', () => {
      SDK_INFO.name = 'TypeScript';
      reloadMock.mockClear();
      dispatchEventSpy.mockClear();

      render();

      expect(reloadMock).toBeCalledTimes(1);
      expect(dispatchEventSpy).toBeCalledTimes(1);
    });

    it('should not call window.location.reload when SDK name is not TypeScript', () => {
      SDK_INFO.name = 'ReactJS';
      reloadMock.mockClear();
      dispatchEventSpy.mockClear();

      render();

      expect(reloadMock).toBeCalledTimes(0);
      expect(dispatchEventSpy).toBeCalledTimes(1);
    });

    it('should dispatch custom event even when reload is called for TypeScript SDK', () => {
      SDK_INFO.name = 'TypeScript';
      dispatchEventSpy.mockClear();

      render(true);

      expect(dispatchEventSpy).toBeCalledTimes(1);
      const dispatchedEvent = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(dispatchedEvent.type).toBe(INTERNAL_EVENTS.FsTriggerRendering);
      expect(dispatchedEvent.detail).toEqual({ forcedReFetchFlags: true });
    });
  });
});
