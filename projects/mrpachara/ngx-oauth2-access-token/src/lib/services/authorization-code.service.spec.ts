import { TestBed } from '@angular/core/testing';
import { StateExpiredError } from '../errors';
import {
  AUTHORIZATION_CODE_CONFIG,
  AUTHORIZATION_CODE_STORAGE,
} from '../tokens';
import { createIdKey } from '../tokens/common';
import { AuthorizationCodeConfig, Scopes } from '../types';
import { AccessTokenService } from './access-token.service';
import { AuthorizationCodeService } from './authorization-code.service';

// Mock dependencies
const mockStorage = {
  store: vi.fn(),
  load: vi.fn(),
  remove: vi.fn(),
  removeExpired: vi.fn(),
};

const mockAccessTokenService = {
  id: createIdKey('test'),
  clientId: 'test-client',
  fetch: vi.fn(),
};

const testConfig: AuthorizationCodeConfig = {
  authorizationCodeUrl: 'https://example.com/auth',
  redirectUri: 'https://example.com/callback',
  pkce: 'S256',
};

describe('AuthorizationCodeService - with PKCE', () => {
  let service: AuthorizationCodeService;

  beforeEach(() => {
    vi.resetAllMocks();

    mockStorage.removeExpired.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        AuthorizationCodeService,
        { provide: AUTHORIZATION_CODE_CONFIG, useValue: testConfig },
        { provide: AUTHORIZATION_CODE_STORAGE, useValue: mockStorage },
        { provide: AccessTokenService, useValue: mockAccessTokenService },
      ],
    });

    service = TestBed.inject(AuthorizationCodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateUrl', () => {
    it('should generate authorization URL with PKCE', async () => {
      const scopes = ['read', 'write'] as Scopes;
      const stateData = { user: 'test' };
      const params = { prompt: 'consent' };

      mockStorage.store.mockResolvedValue(undefined);

      const url = await service.generateUrl(scopes, stateData, { params });

      expect(url.href).toContain('https://example.com/auth');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('client_id')).toBe('test-client');
      expect(url.searchParams.get('redirect_uri')).toBe(
        'https://example.com/callback',
      );
      expect(url.searchParams.get('scope')).toBe('read write');
      expect(url.searchParams.get('state')).toBeTruthy();
      expect(url.searchParams.get('code_challenge')).toBeTruthy();
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('prompt')).toBe('consent');

      expect(mockStorage.store).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          expiresAt: expect.any(Number),
          codeVerifier: expect.any(String),
          data: stateData,
        }),
      );
    });
  });

  describe('exchangeCode', () => {
    it('should exchange code for access token', async () => {
      const state = 'test-state';
      const code = 'test-code';
      const storedData = {
        expiresAt: Date.now() + 10000,
        codeVerifier: 'test-verifier',
        data: { result: 'success' },
      };

      mockStorage.remove.mockResolvedValue(storedData);
      mockAccessTokenService.fetch.mockResolvedValue(undefined);

      const result = await service.exchangeCode(state, code);

      expect(result).toEqual({ result: 'success' });
      expect(mockStorage.remove).toHaveBeenCalledWith(state);
      expect(mockAccessTokenService.fetch).toHaveBeenCalledWith(
        'authorization_code',
        code,
        testConfig.redirectUri,
        { codeVerifier: 'test-verifier' },
      );
    });

    it('should throw StateNotFoundError if state not found', async () => {
      mockStorage.remove.mockResolvedValue(null);

      await expect(service.exchangeCode('invalid', 'code')).rejects.toThrow(
        'State not found',
      );
    });

    it('should throw StateExpiredError if state expired', async () => {
      const expiredData = {
        expiresAt: Date.now() - 1000,
        data: {},
      };

      mockStorage.remove.mockResolvedValue(expiredData);

      await expect(service.exchangeCode('expired', 'code')).rejects.toThrow(
        StateExpiredError,
      );
    });
  });

  describe('clearState', () => {
    it('should return state data if valid', async () => {
      const state = 'test-state';
      const storedData = {
        expiresAt: Date.now() + 10000,
        data: { user: 'test' },
      };

      mockStorage.remove.mockResolvedValue(storedData);

      const result = await service.clearState(state);

      expect(result).toEqual({ user: 'test' });
      expect(mockStorage.remove).toHaveBeenCalledWith(state);
    });

    it('should return undefined if state not found', async () => {
      mockStorage.remove.mockResolvedValue(null);

      const result = await service.clearState('invalid');

      expect(result).toBeUndefined();
    });

    it('should return undefined if state expired', async () => {
      const expiredData = {
        expiresAt: Date.now() - 1000,
        data: {},
      };

      mockStorage.remove.mockResolvedValue(expiredData);

      const result = await service.clearState('expired');

      expect(result).toBeUndefined();
    });
  });
});

describe('AuthorizationCodeService - without PKCE', () => {
  let service: AuthorizationCodeService;

  beforeEach(() => {
    const configWithoutPkce = { ...testConfig, pkce: undefined };
    TestBed.configureTestingModule({
      providers: [
        AuthorizationCodeService,
        { provide: AUTHORIZATION_CODE_CONFIG, useValue: configWithoutPkce },
        { provide: AUTHORIZATION_CODE_STORAGE, useValue: mockStorage },
        { provide: AccessTokenService, useValue: mockAccessTokenService },
      ],
    });

    service = TestBed.inject(AuthorizationCodeService);

    // Reset mocks
    vi.clearAllMocks();
    mockStorage.removeExpired.mockResolvedValue(undefined);
  });

  describe('generateUrl', () => {
    it('should generate URL without PKCE if pkce is undefined', async () => {
      const scopes = ['read'] as Scopes;
      const stateData = {};

      mockStorage.store.mockResolvedValue(undefined);

      const url = await service.generateUrl(scopes, stateData);

      expect(url.searchParams.has('code_challenge')).toBe(false);
      expect(url.searchParams.has('code_challenge_method')).toBe(false);

      expect(mockStorage.store).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          expiresAt: expect.any(Number),
          data: stateData,
        }),
      );
      expect(mockStorage.store).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ codeVerifier: expect.anything() }),
      );
    });
  });
});
