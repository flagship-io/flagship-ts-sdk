import { expect, it, describe } from '@jest/globals';
import { FSFlagMetadata } from '../../src/flag/FSFlagMetadata';
import { IFSFlagMetadata } from '../../src/types';

describe('test FlagMetadata', () => {
  it('test property', () => {
    const metadata: Omit<IFSFlagMetadata, 'toJSON'> = {
      campaignId: 'campaignID',
      variationGroupId: 'variationGroupID',
      variationId: 'variationID',
      isReference: true,
      campaignType: 'type',
      campaignName: 'campaignName',
      variationGroupName: 'variationGroupName',
      variationName: 'variationName'
    };
    const flagMetadata = new FSFlagMetadata(metadata);
    expect(flagMetadata).toEqual(metadata);
  });

  it('test empty property', () => {
    const metadata:Omit<IFSFlagMetadata, 'toJSON'> = {
      campaignId: '',
      variationGroupId: '',
      variationId: '',
      isReference: false,
      campaignType: '',
      campaignName: '',
      variationGroupName: '',
      variationName: ''
    };
    const flagMetadata = new FSFlagMetadata(metadata);
    expect(flagMetadata).toEqual(metadata);
  });
});
