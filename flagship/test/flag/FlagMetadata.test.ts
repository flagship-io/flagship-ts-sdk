import { expect, it, describe } from '@jest/globals'
import { FlagMetadata, IFlagMetadata } from '../../src/flag/FlagMetadata'

describe('test FlagMetadata', () => {
  it('test property', () => {
    const metadata:IFlagMetadata = {
      campaignId: 'campaignID',
      variationGroupId: 'variationGroupID',
      variationId: 'variationID',
      isReference: true,
      campaignType: 'type'
    }
    const flagMetadata = new FlagMetadata(metadata)
    expect(flagMetadata).toEqual(metadata)
    expect(flagMetadata.toJSON()).toBe(JSON.stringify(metadata))
  })

  it('test empty property', () => {
    const metadata:IFlagMetadata = {
      campaignId: '',
      variationGroupId: '',
      variationId: '',
      isReference: false,
      campaignType: ''
    }
    const flagMetadata = new FlagMetadata(metadata)
    expect(flagMetadata).toEqual(metadata)
    expect(flagMetadata.toJSON()).toBe(JSON.stringify({}))
  })
})
