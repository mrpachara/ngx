import { isJwkRsassa, Jwk } from '@mrpachara/ngx-oauth2-access-token/standard';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import rsassa from './rsassa';

vi.mock(
  '@mrpachara/ngx-oauth2-access-token/standard',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@mrpachara/ngx-oauth2-access-token/standard')
      >();
    return {
      ...actual,
      isJwkRsassa: vi.fn(),
    };
  },
);

describe('Verifiers', () => {
  const mockJwsInfo = {
    signature: new Uint8Array([1, 1, 1]),
    protectedContent: new Uint8Array([2, 2, 2]),
  } as any;

  const mockJwk = {
    kty: 'RSA',
    alg: 'RS256',
    n: '...',
    e: '...',
  } as unknown as Jwk;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return undefined if no JWK is an RSASSA key', async () => {
    vi.mocked(isJwkRsassa).mockReturnValue(false);

    const result = await rsassa(mockJwsInfo, [mockJwk]);

    expect(result).toBeUndefined();
  });

  it('should verify signature successfully', async () => {
    vi.mocked(isJwkRsassa).mockReturnValue(true);

    const importSpy = vi
      .spyOn(crypto.subtle, 'importKey')
      .mockResolvedValue('mock-key' as any);
    const verifySpy = vi.spyOn(crypto.subtle, 'verify').mockResolvedValue(true);

    const result = await rsassa(mockJwsInfo, [mockJwk]);

    expect(importSpy).toHaveBeenCalledWith(
      'jwk',
      mockJwk,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: 'SHA-256' },
      },
      true,
      ['verify'],
    );
    expect(verifySpy).toHaveBeenCalledWith(
      'RSASSA-PKCS1-v1_5',
      'mock-key' as any,
      mockJwsInfo.signature,
      mockJwsInfo.protectedContent,
    );
    expect(result).toBe(true);
  });

  it('should return false if verification fails', async () => {
    vi.mocked(isJwkRsassa).mockReturnValue(true);

    vi.spyOn(crypto.subtle, 'importKey').mockResolvedValue('mock-key' as any);
    vi.spyOn(crypto.subtle, 'verify').mockResolvedValue(false);

    const result = await rsassa(mockJwsInfo, [mockJwk]);

    expect(result).toBe(false);
  });

  it('should handle errors during import and return undefined', async () => {
    vi.mocked(isJwkRsassa).mockReturnValue(true);

    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValue(
      new Error('Key import error'),
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* empty */
    });

    const result = await rsassa(mockJwsInfo, [mockJwk]);

    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
