import { FlagDTO } from '../../src/types'

export const returnModification = new Map<string, FlagDTO>([
  [
    'keyNull',

    {
      key: 'keyNull',
      campaignId: 'c2nrh1hjg50l9thhu8bg',
      variationGroupId: 'c2nrh1hjg50l9thhu8cg',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      isReference: false,
      value: null
    }

  ],
  [
    'keyString',
    {
      key: 'keyString',
      campaignId: 'c2nrh1hjg50l9stringgu8bg',
      variationGroupId: 'c2nrh1hjg50l9thhug8cg',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      isReference: false,
      value: 'value'
    }
  ],
  [
    'keyNumber',
    {
      key: 'keyNumber',
      campaignId: 'c2nrh1hjg50l9thhu8bg',
      variationGroupId: 'c2nrh1hjg50l9thhu8cg',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      isReference: false,
      value: 52
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
      value: true
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
      value: 'value'
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
      value: [1, 1, 1]
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
      value: { carray: [] }
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
      value: { value: 123456 }
    }
  ]
])
