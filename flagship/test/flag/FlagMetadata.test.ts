import { expect, it, describe } from '@jest/globals'
import { FlagMetadata, IFlagMetadata } from '../../src/flag/FlagMetadata'

describe('test FlagMetadata', () => {
  it('test property', () => {
    const metadata: Omit<IFlagMetadata, 'toJSON'> = {
      campaignId: 'campaignID',
      variationGroupId: 'variationGroupID',
      variationId: 'variationID',
      isReference: true,
      campaignType: 'type'
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
      campaignType: ''
    }
    const flagMetadata = new FlagMetadata(metadata)
    expect(flagMetadata).toEqual(metadata)
  })
})
