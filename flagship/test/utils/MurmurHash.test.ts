import { expect, it, describe } from '@jest/globals'
import { MurmurHash } from '../../src/utils/MurmurHash'

describe('test MurmurHash', () => {
  const murmurHash = new MurmurHash()
  it('test 1', () => {
    const hash = murmurHash.murmurHash3Int32('123visitor_1')
    expect(hash).toBe(3635969351)
  })
  it('test 2 ', () => {
    const hash = murmurHash.murmurHash3Int32('9273BKSDJtoto123456')
    expect(hash).toBe(2207745127)
  })

  it('test 3 ', () => {
    const hash = murmurHash.murmurHash3Int32('vgidflagship@abtast.com')
    expect(hash).toBe(1551214225)
  })

  it('test 4', () => {
    const hash = murmurHash.murmurHash3Int32('vgidéééàëééééé')
    expect(hash).toBe(1027180842)
  })
})
