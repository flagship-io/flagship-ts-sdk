import { expect, it, describe, jest, afterAll, beforeEach } from '@jest/globals'
import { forceVariation } from '../../src/flag/forceVariation'
import { DecisionApiConfig, FlagDTO, FsVariationToForce } from '../../src'
import * as utils from '../../src/utils/utils'
import { mockGlobals } from '../helpers'

describe('forceVariation - No Forced Variation Conditions', () => {
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser')
  const flagDTO: FlagDTO = {
    key: 'key',
    campaignId: 'campaignId',
    campaignName: 'campaignName',
    variationGroupId: 'variationGroupId',
    variationGroupName: 'variationGroupName',
    variationId: 'variationId',
    variationName: 'variationName',
    isReference: true,
    campaignType: 'campaignType',
    slug: 'slug',
    value: { key: 'value' }
  }

  beforeEach(() => {
    isBrowserSpy.mockReturnValue(true)
    global.window = global.window ?? undefined
    mockGlobals({
      __fsWebpackIsBrowser__: true
    })
  })

  afterAll(() => {
    isBrowserSpy.mockReturnValue(false)
    global.window = global.window ?? undefined
  })

  it('should return undefined when QA mode is disabled', () => {
    const config = new DecisionApiConfig()
    const forcedVariation = forceVariation({ flagDTO, config })
    expect(forcedVariation).toBeUndefined()
  })

  it('should return undefined when the environment is not a browser', () => {
    const config = new DecisionApiConfig()
    config.isQAModeEnabled = true
    isBrowserSpy.mockReturnValue(false)
    const forcedVariation = forceVariation({ flagDTO, config })
    expect(forcedVariation).toBeUndefined()
  })

  it('should return undefined when __fsWebpackIsBrowser__ is false', () => {
    mockGlobals({
      __fsWebpackIsBrowser__: false
    })
    const config = new DecisionApiConfig()
    config.isQAModeEnabled = true
    const forcedVariation = forceVariation({ flagDTO, config })
    expect(forcedVariation).toBeUndefined()
  })

  it('should return undefined when flagDTO is missing', () => {
    const config = new DecisionApiConfig()
    config.isQAModeEnabled = true
    const forcedVariation = forceVariation({ flagDTO: undefined, config })
    expect(forcedVariation).toBeUndefined()
  })

  it('should return undefined when window.flagship.forcedVariations is undefined', () => {
    const config = new DecisionApiConfig()
    config.isQAModeEnabled = true
    const forcedVariation = forceVariation({ flagDTO, config })
    expect(forcedVariation).toBeUndefined()
  })
})

describe('forceVariation - Forced Variation Scenario', () => {
  const isBrowserSpy = jest.spyOn(utils, 'isBrowser')
  const flagDTO: FlagDTO = {
    key: 'key',
    campaignId: 'campaignId',
    campaignName: 'campaignName',
    variationGroupId: 'variationGroupId',
    variationGroupName: 'variationGroupName',
    variationId: 'variationId',
    variationName: 'variationName',
    isReference: true,
    campaignType: 'campaignType',
    slug: 'slug',
    value: { key: 'value' }
  }

  const forcedFlagValue = 'valueForced'
  const forcedVariations: Record<string, FsVariationToForce> = {
    campaignId: {
      campaignId: 'campaignId',
      campaignName: 'campaignName',
      campaignType: 'campaignType',
      CampaignSlug: 'slug',
      variationGroupId: 'variationGroupId',
      variationGroupName: 'variationGroupName',
      variation: {
        id: 'variationIdForced',
        name: 'variationNameForced',
        reference: false,
        modifications: {
          type: 'flag',
          value: { key: forcedFlagValue }
        }
      }
    },
    campaignId2: {
      campaignId: 'campaignId2',
      campaignName: 'campaignName2',
      campaignType: 'campaignType2',
      CampaignSlug: 'slug',
      variationGroupId: 'variationGroupId2',
      variationGroupName: 'variationGroupName2',
      variation: {
        id: 'variationId2',
        name: 'variationName2',
        reference: true,
        modifications: {
          type: 'flag',
          value: { key2: 'value2' }
        }
      }
    }
  }

  beforeEach(() => {
    isBrowserSpy.mockReturnValue(true)
    mockGlobals({
      __fsWebpackIsBrowser__: true
    })
  })

  afterAll(() => {
    isBrowserSpy.mockReturnValue(false)
  })

  it('should return undefined when the campaign is not forced', () => {
    global.window = global.window ?? {
      flagship: {
        forcedVariations
      }
    }
    const config = new DecisionApiConfig()
    config.isQAModeEnabled = true
    const forcedVariation = forceVariation({ flagDTO: { ...flagDTO, campaignId: 'campaignId3' }, config })
    expect(forcedVariation).toBeUndefined()
  })

  it('should return the forced variation when the campaign is forced', () => {
    global.window = global.window ?? {
      flagship: {
        forcedVariations
      }
    }
    const config = new DecisionApiConfig()
    config.isQAModeEnabled = true
    const valueForced = forceVariation({ flagDTO, config })
    const forcedVariation = forcedVariations[flagDTO.campaignId]
    const { campaignId, campaignName, variationGroupId, variationGroupName, variation, campaignType, CampaignSlug } = forcedVariation
    expect(valueForced).toEqual({
      key: flagDTO.key,
      campaignId,
      campaignName,
      variationGroupId,
      variationGroupName: variationGroupName as string,
      variationId: variation.id,
      variationName: variation.name as string,
      isReference: !!variation.reference,
      campaignType,
      slug: CampaignSlug,
      value: forcedFlagValue
    })
  })
})
