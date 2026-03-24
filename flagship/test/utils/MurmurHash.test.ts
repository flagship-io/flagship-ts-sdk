import { expect, it, describe } from '@jest/globals';
import { MurmurHash } from '../../src/utils/MurmurHash';

describe('MurmurHash', () => {
  const murmurHash = new MurmurHash();
  it("should hash '123visitor_1' to 3635969351", () => {
    const hash = murmurHash.murmurHash3Int32('123visitor_1');
    expect(hash).toBe(3635969351);
  });
  it("should hash '9273BKSDJtoto123456' to 2207745127", () => {
    const hash = murmurHash.murmurHash3Int32('9273BKSDJtoto123456');
    expect(hash).toBe(2207745127);
  });

  it("should hash 'vgidflagship@abtast.com' to 1551214225", () => {
    const hash = murmurHash.murmurHash3Int32('vgidflagship@abtast.com');
    expect(hash).toBe(1551214225);
  });

  it("should handle unicode characters and hash 'vgidéééàëééééé' to 1027180842", () => {
    const hash = murmurHash.murmurHash3Int32('vgidéééàëééééé');
    expect(hash).toBe(1027180842);
  });
});
