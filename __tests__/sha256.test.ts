/**
 * sha256Hex — pure-JS SHA-256 used to verify downloaded translation packs
 * (translation packs, phase 4). Checked against FIPS 180-4 known vectors and
 * cross-checked against Node's crypto for random binary input.
 */
import {createHash} from 'crypto';
import {sha256Hex} from '@/lib/database/sha256';

const enc = (s: string) => new TextEncoder().encode(s);

describe('sha256Hex', () => {
  it('matches known vectors', () => {
    expect(sha256Hex(enc(''))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(sha256Hex(enc('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(sha256Hex(enc('hello'))).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('handles the 55/56/64-byte padding boundaries', () => {
    for (const n of [54, 55, 56, 57, 63, 64, 65, 119, 120]) {
      const data = enc('a'.repeat(n));
      const expected = createHash('sha256').update(data).digest('hex');
      expect(sha256Hex(data)).toBe(expected);
    }
  });

  it('matches Node crypto for the 448-bit vector', () => {
    const msg = enc('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq');
    expect(sha256Hex(msg)).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('matches Node crypto for random binary blobs of varied length', () => {
    for (const len of [0, 1, 1000, 5000, 100000]) {
      const data = new Uint8Array(len);
      for (let i = 0; i < len; i++) data[i] = (i * 31 + 7) & 0xff;
      const expected = createHash('sha256').update(data).digest('hex');
      expect(sha256Hex(data)).toBe(expected);
    }
  });
});
