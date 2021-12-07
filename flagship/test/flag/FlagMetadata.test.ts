import { expect, it, describe } from '@jest/globals'
import { FlagMetadata, IFlagMetadata } from '../../src/flag/FlagMetadata'

describe('test FlagMetadata', () => {
  const metadata:IFlagMetadata = {
    campaignId: 'campaignID',
    variationGroupId: 'variationGroupID',
    variationId: 'variationID',
    isReference: true,
    campaignType: 'type'
  }
  const flagMetadata = new FlagMetadata(metadata)
  it('test property', () => {
    expect(flagMetadata).toEqual(metadata)
    expect(flagMetadata.toJSON()).toBe(JSON.stringify(metadata))
  })
})
