/**
 * @jest-environment jsdom
 */
import { jest, it, describe } from '@jest/globals'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager, DecisionApiConfig } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient } from '../../src/utils/HttpClient'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import * as utils from '../../src/utils/utils'
import * as messages from '../../src/qaAssistant/messages'
import { VisitorVariations } from '../../src/types'
import { VisitorAbstract } from '../../src/visitor/VisitorAbstract'
import { IEmotionAI } from '../../src/emotionAI/IEmotionAI'
import { mockGlobals, sleep } from '../helpers'

describe('test sendExposedVariation', () => {
  beforeEach(() => {
    config.isQAModeEnabled = true
    isBrowserSpy.mockReturnValue(true)
    sendVisitorExposedVariationsSpy.mockImplementation(() => {
      //
    })
    mockGlobals({
      __fsWebpackIsBrowser__: true
    })
  })

  const isBrowserSpy = jest.spyOn(utils, 'isBrowser')
  const sendVisitorExposedVariationsSpy = jest.spyOn(messages, 'sendVisitorExposedVariations')
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const init = jest.fn<(visitor:VisitorAbstract) => void>()

  const emotionAi = {
    init
  } as unknown as IEmotionAI

  it('Test sendExposedVariation flag is undefined ', () => {
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      hasConsented: true,
      context,
      configManager: configManager as ConfigManager,
      emotionAi
    })

    visitorDelegate.sendExposedVariation(undefined)
    expect(window.flagship?.exposedVariations).toBeUndefined()
  })

  it('Test sendExposedVariation flag is undefined ', () => {
    isBrowserSpy.mockReturnValue(false)
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      hasConsented: true,
      context,
      configManager: configManager as ConfigManager,
      emotionAi
    })

    visitorDelegate.sendExposedVariation(undefined)
    expect(window.flagship?.exposedVariations).toBeUndefined()
  })

  it('Test sendExposedVariation QA mode is disabled ', () => {
    config.isQAModeEnabled = false
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      hasConsented: true,
      context,
      configManager: configManager as ConfigManager,
      emotionAi
    })

    const flag = {
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      value: 'value',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    }

    const exposedVariations = {
      [flag.campaignId]: {
        campaignId: flag.campaignId,
        variationGroupId: flag.variationGroupId,
        variationId: flag.variationId
      }
    }

    visitorDelegate.sendExposedVariation(flag)
    expect(window.flagship?.exposedVariations).toEqual(exposedVariations)
    expect(sendVisitorExposedVariationsSpy).toBeCalledTimes(0)
  })

  it('Test sendExposedVariation', async () => {
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      hasConsented: true,
      context,
      configManager: configManager as ConfigManager,
      emotionAi
    })

    const flag = {
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      value: 'value',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    }

    const exposedVariations = {
      [flag.campaignId]: {
        campaignId: flag.campaignId,
        variationGroupId: flag.variationGroupId,
        variationId: flag.variationId
      }
    }

    visitorDelegate.sendExposedVariation(flag)
    visitorDelegate.sendExposedVariation(flag)
    await sleep(150)
    expect(window.flagship?.exposedVariations).toEqual(exposedVariations)
    expect(sendVisitorExposedVariationsSpy).toBeCalledTimes(1)
    expect(sendVisitorExposedVariationsSpy).toBeCalledWith(exposedVariations)
  })

  it('Test sendExposedVariation', async () => {
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      hasConsented: true,
      context,
      configManager: configManager as ConfigManager,
      emotionAi
    })

    const flag = {
      key: 'newKey',
      campaignId: 'cma',
      variationGroupId: 'var',
      variationId: 'varId',
      isReference: true,
      value: 'value',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    }
    const flag2 = {
      key: 'newKey2',
      campaignId: 'cma2',
      variationGroupId: 'var2',
      variationId: 'varId2',
      isReference: true,
      value: 'value2',
      campaignName: 'campaignName2',
      variationGroupName: 'variationGroupName2',
      variationName: 'variationName2'
    }

    const exposedVariations = {
      [flag.campaignId]: {
        campaignId: flag.campaignId,
        variationGroupId: flag.variationGroupId,
        variationId: flag.variationId
      },
      [flag2.campaignId]: {
        campaignId: flag2.campaignId,
        variationGroupId: flag2.variationGroupId,
        variationId: flag2.variationId
      }
    }

    visitorDelegate.sendExposedVariation(flag)
    visitorDelegate.sendExposedVariation(flag2)
    await sleep(150)
    expect(window.flagship?.exposedVariations).toEqual(exposedVariations)
    expect(sendVisitorExposedVariationsSpy).toBeCalledTimes(1)
    expect(sendVisitorExposedVariationsSpy).toBeCalledWith(exposedVariations)
  })

  it('Test sendExposedVariation', async () => {
    const visitorDelegate = new VisitorDelegate({
      visitorId,
      hasConsented: true,
      context,
      configManager: configManager as ConfigManager,
      emotionAi
    })

    const exposedVariations:Record<string, VisitorVariations> = {}

    for (let index = 0; index < 10; index++) {
      const flag = {
        key: 'newKey' + index,
        campaignId: 'cma' + index,
        variationGroupId: 'var' + index,
        variationId: 'varId' + index,
        isReference: true,
        value: 'value' + index,
        campaignName: 'campaignName' + index,
        variationGroupName: 'variationGroupName' + index,
        variationName: 'variationName' + index
      }
      exposedVariations[flag.campaignId] = {
        campaignId: flag.campaignId,
        variationGroupId: flag.variationGroupId,
        variationId: flag.variationId
      }
      visitorDelegate.sendExposedVariation(flag)
    }
    await sleep(150)
    expect(window.flagship?.exposedVariations).toEqual(exposedVariations)
    expect(sendVisitorExposedVariationsSpy).toBeCalledTimes(1)
    expect(sendVisitorExposedVariationsSpy).toBeCalledWith(exposedVariations)
  })
})
