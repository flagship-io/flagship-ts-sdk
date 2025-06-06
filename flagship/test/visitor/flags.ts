import { FlagDTO } from '../../src/types';

export const returnFlag = new Map<string, FlagDTO>([
  [
    'keyNull',
    {
      key: 'keyNull',
      campaignId: 'c2nrh1hjg50l9thhu8bg',
      variationGroupId: 'c2nrh1hjg50l9thhu8cg',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      campaignName: 'campaignName-1',
      variationGroupName: 'variationGroupName-1',
      variationName: 'variationName-1',
      isReference: false,
      value: null
    }

  ],
  [
    'keyString',
    {
      key: 'keyString',
      campaignId: 'c2nrh1hjg50l9stringgu8bg',
      variationGroupId: 'c2nrh1hjg50l9thhu8cg',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      isReference: false,
      value: 'value',
      campaignName: 'campaignName-1',
      variationGroupName: 'variationGroupName-1',
      variationName: 'variationName-1'
    }
  ],
  [
    'keyNumber',
    {
      key: 'keyNumber',
      campaignId: 'c2nrh1hjg50l9thhu8bg',
      variationGroupId: 'c2nrh1hjg50l9thhug8cg',
      variationId: 'c2nrh1hjg50l9thhu8dgk',
      isReference: false,
      value: 52,
      campaignName: 'campaignName-3',
      variationGroupName: 'variationGroupName-3',
      variationName: 'variationName-2'
    }
  ],
  [
    'keyBoolean',

    {
      key: 'keyBoolean',
      campaignId: 'c2nrh1hjg50l9thhu8bgkeyB',
      variationGroupId: 'c2nrh1hjg50l9thhu8cgKeyBoolean',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      isReference: false,
      value: true,
      campaignName: 'campaignName-1',
      variationGroupName: 'variationGroupName-1',
      variationName: 'variationName-1'
    }

  ],
  [
    'key',

    {
      key: 'key',
      campaignId: 'c2nrh1hjg50l9thhu8bg',
      variationGroupId: 'c2nrh1hjg50l9thhu8cg',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      isReference: false,
      value: 'value',
      campaignName: 'campaignName-1',
      variationGroupName: 'variationGroupName-1',
      variationName: 'variationName-1'
    }

  ],
  [
    'array',

    {
      key: 'array',
      campaignId: 'c3ev1afkprbg5u3burag',
      variationGroupId: 'c3ev1afkprbg5u3burbg',
      variationId: 'c3ev1afkprbg5u3burcg',
      isReference: false,
      value: [1, 1, 1],
      campaignName: 'campaignName-2',
      variationGroupName: 'variationGroupName-2',
      variationName: 'variationName-2'
    }

  ],
  [
    'complex',

    {
      key: 'complex',
      campaignId: 'c3ev1afkprbg5u3burag',
      variationGroupId: 'c3ev1afkprbg5u3burbg',
      variationId: 'c3ev1afkprbg5u3burcg',
      isReference: false,
      value: { carray: [] },
      campaignName: 'campaignName-2',
      variationGroupName: 'variationGroupName-2',
      variationName: 'variationName-2'
    }

  ],
  [
    'object',

    {
      key: 'object',
      campaignId: 'c3ev1afkprbg5u3burag',
      variationGroupId: 'c3ev1afkprbg5u3burbg',
      variationId: 'c3ev1afkprbg5u3burcg',
      isReference: false,
      value: { value: 123456 },
      campaignName: 'campaignName-2',
      variationGroupName: 'variationGroupName-2',
      variationName: 'variationName-2'
    }
  ]
]);
