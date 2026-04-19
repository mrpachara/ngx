import {
  Jwk,
  JwsInfo,
  JwtInfo,
} from '@mrpachara/ngx-oauth2-access-token/standard';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import eddsa from './eddsa';

describe('Verifiers', () => {
  const mockJwsInfo = {
    signature: new Uint8Array([1, 1, 1]),
    protectedContent: new Uint8Array([2, 2, 2]),
  } as unknown as Extract<JwtInfo, JwsInfo>;

  const mockJwk = {
    kty: 'OKP',
    alg: 'EdDSA',
    crv: 'Ed25519',
    x: '...',
  } as unknown as Jwk;

  const mockCryptoKey = {
    algorithm: { name: 'Ed25519' },
  } as unknown as CryptoKey;

  beforeEach(() => {
    vi.restoreAllMocks(); // Restore other spies like crypto.subtle
  });

  it('should return undefined if no JWK is an EdDSA key', async () => {
    const nonEdJwk = { kty: 'RSA' } as unknown as Jwk;

    const result = await eddsa(mockJwsInfo, [nonEdJwk]);
    expect(result).toBeUndefined();
  });

  it('should verify signature successfully', async () => {
    const importSpy = vi
      .spyOn(crypto.subtle, 'importKey')
      .mockResolvedValue(mockCryptoKey);
    const verifySpy = vi.spyOn(crypto.subtle, 'verify').mockResolvedValue(true);

    const result = await eddsa(mockJwsInfo, [mockJwk]);

    expect(importSpy).toHaveBeenCalledWith(
      'jwk',
      mockJwk,
      {
        name: 'Ed25519',
      },
      true,
      ['verify'],
    );
    expect(verifySpy).toHaveBeenCalledWith(
      {
        name: 'Ed25519',
      },
      mockCryptoKey,
      mockJwsInfo.signature,
      mockJwsInfo.protectedContent,
    );
    expect(result).toBe(true);
  });

  it('should return false if verification fails', async () => {
    vi.spyOn(crypto.subtle, 'importKey').mockResolvedValue(mockCryptoKey);
    vi.spyOn(crypto.subtle, 'verify').mockResolvedValue(false);

    const result = await eddsa(mockJwsInfo, [mockJwk]);

    expect(result).toBe(false);
  });

  it('should handle errors during import and return undefined', async () => {
    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValue(
      new Error('Key import error'),
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* empty */
    });

    const result = await eddsa(mockJwsInfo, [mockJwk]);

    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
