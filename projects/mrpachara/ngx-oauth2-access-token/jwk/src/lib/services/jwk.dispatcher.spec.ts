import { TestBed } from '@angular/core/testing';
import {
  JwsInfo,
  JwtInfo,
  MatchedIssuerNotFoundError,
  NonprovidedIssuerError,
} from '@mrpachara/ngx-oauth2-access-token/standard';
import { JWK_SERVICES } from '../tokens';
import { JwkDispatcher } from './jwk.dispatcher';

const mockJwkService = {
  issuer: 'https://example.com',
  verify: vi.fn(),
};

describe('JwkDispatcher', () => {
  let service: JwkDispatcher;

  const jwtOverJwsInfo = {
    header: { alg: 'RS256', typ: 'JWT', iss: 'https://example.com' },
    payload: { iss: 'https://example.com' },
    signature: new Uint8Array(),
    protectedContent: new Uint8Array(),
    serial: 'abc',
  } as unknown as Extract<JwtInfo, JwsInfo>;

  beforeEach(() => {
    vi.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [
        { provide: JWK_SERVICES, multi: true, useValue: mockJwkService },
        JwkDispatcher,
      ],
    });

    service = TestBed.inject(JwkDispatcher);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should find a service by issuer', () => {
    expect(service.findByIssuer('https://example.com')).toBe(mockJwkService);
  });

  it('should verify using matched issuer service', async () => {
    mockJwkService.verify.mockResolvedValue(true);

    await expect(service.verify(jwtOverJwsInfo)).resolves.toBe(true);
    expect(mockJwkService.verify).toHaveBeenCalledWith(jwtOverJwsInfo);
  });

  it('should return false when matched service rejects verification', async () => {
    mockJwkService.verify.mockResolvedValue(false);

    await expect(service.verify(jwtOverJwsInfo)).resolves.toBe(false);
    expect(mockJwkService.verify).toHaveBeenCalledWith(jwtOverJwsInfo);
  });

  it('should throw NonprovidedIssuerError when issuer is absent', async () => {
    const missingIssuer = {
      ...jwtOverJwsInfo,
      header: { ...jwtOverJwsInfo.header, iss: undefined },
      payload: { ...jwtOverJwsInfo.payload, iss: undefined },
    } as unknown as typeof jwtOverJwsInfo;

    await expect(service.verify(missingIssuer)).rejects.toThrow(
      NonprovidedIssuerError,
    );
  });

  it('should throw MatchedIssuerNotFoundError when no service matches issuer', async () => {
    const unmatched = {
      ...jwtOverJwsInfo,
      header: { ...jwtOverJwsInfo.header, iss: 'https://notfound.example' },
      payload: { ...jwtOverJwsInfo.payload, iss: 'https://notfound.example' },
    } as unknown as typeof jwtOverJwsInfo;

    await expect(service.verify(unmatched)).rejects.toThrow(
      MatchedIssuerNotFoundError,
    );
  });
});
