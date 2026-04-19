import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  JwsInfo,
  JwtInfo,
  MatchedJwkNotFoundError,
  SupportedJwkAlgNotFoundError,
} from '@mrpachara/ngx-oauth2-access-token/standard';
import { JWK_CONFIG, JWT_VERIFIERS } from '../tokens';
import { JwkService } from './jwk.service';

const mockJwkSet = {
  keys: [
    {
      kty: 'RSA',
      use: 'sig',
      kid: '12345',
      alg: 'RS256',
      n: '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVv7c',
      e: 'AQAB',
    },
  ],
};

const mockConfig = {
  issuer: 'https://example.com',
  jwkSetUrl: 'https://example.com/.well-known/jwks.json',
};

const mockVerifier = vi.fn();

describe('JwkService', () => {
  let service: JwkService;
  let httpTestingController: HttpTestingController;

  const jwtOverJwsInfo = {
    header: { alg: 'RS256', typ: 'JWT', kid: '12345' },
    payload: { iss: 'https://example.com' },
    signature: new Uint8Array(),
    protectedContent: new Uint8Array(),
    serial: 'abc',
  } as unknown as Extract<JwtInfo, JwsInfo>;

  beforeEach(() => {
    vi.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: JWK_CONFIG, useValue: mockConfig },
        { provide: JWT_VERIFIERS, multi: true, useValue: mockVerifier },
        JwkService,
      ],
    });

    service = TestBed.inject(JwkService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return the issuer from config', () => {
    expect(service.issuer).toBe('https://example.com');
  });

  it('should verify successfully when verifier returns true', async () => {
    mockVerifier.mockResolvedValue(true);

    const verifyPromise = service.verify(jwtOverJwsInfo);

    const req = httpTestingController.expectOne(mockConfig.jwkSetUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockJwkSet);

    await expect(verifyPromise).resolves.toBe(true);
    expect(mockVerifier).toHaveBeenCalledWith(jwtOverJwsInfo, mockJwkSet.keys);
  });

  it('should verify and return false when verifier returns false', async () => {
    mockVerifier.mockResolvedValue(false);

    const verifyPromise = service.verify(jwtOverJwsInfo);

    const req = httpTestingController.expectOne(mockConfig.jwkSetUrl);
    req.flush(mockJwkSet);

    await expect(verifyPromise).resolves.toBe(false);
    expect(mockVerifier).toHaveBeenCalledWith(jwtOverJwsInfo, mockJwkSet.keys);
  });

  it('should throw MatchedJwkNotFoundError when no JWKs match', async () => {
    const noMatchJwkSet = { keys: [] };

    const verifyPromise = service.verify(jwtOverJwsInfo);

    const req = httpTestingController.expectOne(mockConfig.jwkSetUrl);
    req.flush(noMatchJwkSet);

    await expect(verifyPromise).rejects.toThrow(MatchedJwkNotFoundError);
  });

  it('should throw SupportedJwkAlgNotFoundError when no verifier supports the JWKs', async () => {
    mockVerifier.mockResolvedValue(undefined);

    const verifyPromise = service.verify(jwtOverJwsInfo);

    const req = httpTestingController.expectOne(mockConfig.jwkSetUrl);
    req.flush(mockJwkSet);

    await expect(verifyPromise).rejects.toThrow(SupportedJwkAlgNotFoundError);
  });
});

const mockVerifier2 = vi.fn();

describe('JwkService - multiple verifiers', () => {
  let service: JwkService;
  let httpTestingController: HttpTestingController;

  const jwtOverJwsInfo = {
    header: { alg: 'RS256', typ: 'JWT', kid: '12345' },
    payload: { iss: 'https://example.com' },
    signature: new Uint8Array(),
    protectedContent: new Uint8Array(),
    serial: 'abc',
  } as unknown as Extract<JwtInfo, JwsInfo>;

  beforeEach(() => {
    vi.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: JWK_CONFIG, useValue: mockConfig },
        { provide: JWT_VERIFIERS, multi: true, useValue: mockVerifier },
        { provide: JWT_VERIFIERS, multi: true, useValue: mockVerifier2 },
        JwkService,
      ],
    });

    service = TestBed.inject(JwkService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should continue to next verifier when first returns undefined', async () => {
    mockVerifier.mockResolvedValue(undefined);
    mockVerifier2.mockResolvedValue(true);

    const verifyPromise = service.verify(jwtOverJwsInfo);

    const req = httpTestingController.expectOne(mockConfig.jwkSetUrl);
    req.flush(mockJwkSet);

    await expect(verifyPromise).resolves.toBe(true);
    expect(mockVerifier).toHaveBeenCalledWith(jwtOverJwsInfo, mockJwkSet.keys);
    expect(mockVerifier2).toHaveBeenCalledWith(jwtOverJwsInfo, mockJwkSet.keys);
  });
});
