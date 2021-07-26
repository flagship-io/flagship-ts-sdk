import { Modification } from '../../src/model/Modification'

export const returnModification = new Map<string, Modification>([
  [
    'keyNull',
    new Modification(
      'keyNull',
      'c2nrh1hjg50l9thhu8bg',
      'c2nrh1hjg50l9thhu8cg',
      'c2nrh1hjg50l9thhu8dg',
      false,
      null
    )
  ],
  [
    'keyString',
    new Modification(
      'keyString',
      'c2nrh1hjg50l9stringu8bg',
      'c2nrh1hjg50l9thhu8cg',
      'c2nrh1hjg50l9thhu8dg',
      false,
      'value'
    )
  ],
  [
    'keyNumber',
    new Modification(
      'keyNumber',
      'c2nrh1hjg50l9thhu8bg',
      'c2nrh1hjg50l9thhu8cg',
      'c2nrh1hjg50l9thhu8dg',
      false,
      52
    )
  ],
  [
    'keyBoolean',
    new Modification(
      'keyBoolean',
      'c2nrh1hjg50l9thhu8bg',
      'c2nrh1hjg50l9thhu8cg',
      'c2nrh1hjg50l9thhu8dg',
      false,
      true
    )
  ],
  [
    'key',
    new Modification(
      'key',
      'c2nrh1hjg50l9thhu8bg',
      'c2nrh1hjg50l9thhu8cg',
      'c2nrh1hjg50l9thhu8dg',
      false,
      'value'
    )
  ],
  [
    'array',
    new Modification(
      'array',
      'c3ev1afkprbg5u3burag',
      'c3ev1afkprbg5u3burbg',
      'c3ev1afkprbg5u3burcg',
      false,
      [1, 1, 1]
    )
  ],
  [
    'complex',
    new Modification(
      'complex',
      'c3ev1afkprbg5u3burag',
      'c3ev1afkprbg5u3burbg',
      'c3ev1afkprbg5u3burcg',
      false,
      { carray: [] }
    )
  ],
  [
    'object',
    new Modification(
      'object',
      'c3ev1afkprbg5u3burag',
      'c3ev1afkprbg5u3burbg',
      'c3ev1afkprbg5u3burcg',
      false,
      { value: 123456 }
    )
  ]
])
