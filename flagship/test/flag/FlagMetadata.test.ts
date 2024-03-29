import { expect, it, describe } from '@jest/globals'
import { FlagMetadata } from '../../src/flag/FlagMetadata'
import { IFlagMetadata } from '../../src/types'

describe('test FlagMetadata', () => {
  it('test property', () => {
    const metadata: Omit<IFlagMetadata, 'toJSON'> = {
      campaignId: 'campaignID',
      variationGroupId: 'variationGroupID',
      variationId: 'variationID',
      isReference: true,
      campaignType: 'type',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    }
    const flagMetadata = new FlagMetadata(metadata)
    expect(flagMetadata).toEqual(metadata)
  })

  it('test empty property', () => {
    const metadata:Omit<IFlagMetadata, 'toJSON'> = {
      campaignId: '',
      variationGroupId: '',
      variationId: '',
      isReference: false,
      campaignType: '',
      campaignName: '',
      variationGroupName: '',
      variationName: ''
    }
    const flagMetadata = new FlagMetadata(metadata)
    expect(flagMetadata).toEqual(metadata)
  })
})
