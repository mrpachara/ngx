import { APP_ID, ApplicationRef, ResourceStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AccessTokenResponse } from '@mrpachara/ngx-oauth2-access-token/standard';
import { vi } from 'vitest';
import {
  AccessTokenNotFoundError,
  RefreshTokenExpiredError,
  RefreshTokenNotFoundError,
} from '../errors';

import {
  ACCESS_TOKEN_CONFIG,
  ACCESS_TOKEN_RESPONSE_EXTRACTORS,
  ACCESS_TOKEN_STORAGE,
} from '../tokens';
import { createIdKey } from '../tokens/common';
import { AccessTokenConfig } from '../types';
import { AccessTokenService } from './access-token.service';
import {
  defaultRefreshTokenTtl,
  networkLatencyTime,
} from './access-token.service.default';
import { Oauth2Client } from './oauth2.client';

// Mock the global navigator.locks API
vi.stubGlobal('navigator', {
  ...navigator,
  locks: {
    request: vi.fn(async (name, optionsOrCallback, callback) => {
      const cb =
        typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
      return await cb({ name }); // Immediately grant the lock
    }),
    query: vi.fn().mockResolvedValue({ held: [], pending: [] }),
  },
});

// Mock dependencies
const mockStorage = {
  load: vi.fn(),
  store: vi.fn(),
  clear: vi.fn(),
};

const mockClient = {
  fetchAccessToken: vi.fn(),
};

const mockExtractors = [
  {
    update: vi.fn(),
  },
];

const id = createIdKey('test');

describe('AccessTokenService: simple configuration', () => {
  const testConfig: AccessTokenConfig = {
    id,
    clientId: 'test-client',
    clientSecret: 'test-secret',
    accessTokenUrl: 'https://example.com/token',
  };

  let service: AccessTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccessTokenService,
        { provide: APP_ID, useValue: 'test-app' },
        { provide: ACCESS_TOKEN_CONFIG, useValue: testConfig },
        { provide: ACCESS_TOKEN_STORAGE, useValue: mockStorage },
        { provide: ACCESS_TOKEN_RESPONSE_EXTRACTORS, useValue: mockExtractors },
        { provide: Oauth2Client, useValue: mockClient },
      ],
    });

    service = TestBed.inject(AccessTokenService);

    // Reset mocks (also clears mock implementations)
    vi.resetAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetch', () => {
    describe('should fetch access token for client_credentials grant', () => {
      it('respond without refresh token', async () => {
        const now = Date.now();

        const response: AccessTokenResponse = {
          access_token: 'test-token',
          token_type: 'bearer',
          expires_in: 3_600,
        };

        mockClient.fetchAccessToken.mockResolvedValue(response);

        await service.fetch('client_credentials');

        expect(mockClient.fetchAccessToken).toHaveBeenCalledWith(
          testConfig.accessTokenUrl,
          { id: testConfig.clientId, secret: testConfig.clientSecret },
          { grant_type: 'client_credentials' },
          {
            params: undefined,
            credentialsInParams: false,
          },
        );

        expect(mockStorage.store).toHaveBeenCalledTimes(1);

        expect(mockStorage.store).toHaveBeenCalledWith('access', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value >
                now +
                  response.expires_in! * 1_000 -
                  networkLatencyTime -
                  1_000 &&
              value <
                now + response.expires_in! * 1_000 - networkLatencyTime + 1_000,
          ), // allow 1s clock skew
          data: response,
        });

        expect(mockExtractors[0].update).toHaveBeenCalledWith(testConfig.id, {
          timestamp: expect.any(Number),
          accessTokenResponse: response,
        });
      });

      it('respond with refresh token', async () => {
        const now = Date.now();

        const response: AccessTokenResponse = {
          access_token: 'test-token',
          token_type: 'bearer',
          expires_in: 3_600,
          refresh_token: 'refresh-token',
        };

        mockClient.fetchAccessToken.mockResolvedValue(response);

        await service.fetch('client_credentials');

        expect(mockClient.fetchAccessToken).toHaveBeenCalledWith(
          testConfig.accessTokenUrl,
          { id: testConfig.clientId, secret: testConfig.clientSecret },
          { grant_type: 'client_credentials' },
          {
            params: undefined,
            credentialsInParams: false,
          },
        );

        expect(mockStorage.store).toHaveBeenCalledTimes(2);

        expect(mockStorage.store).toHaveBeenCalledWith('access', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value >
                now +
                  response.expires_in! * 1_000 -
                  networkLatencyTime -
                  1_000 &&
              value <
                now + response.expires_in! * 1_000 - networkLatencyTime + 1_000,
          ), // allow 1s clock skew
          data: response,
        });

        const refreshTokenTtl = service['config'].refreshTokenTtl;

        assert(typeof refreshTokenTtl === 'number');

        const expectedRefreshTokenTtl =
          now + refreshTokenTtl * 1_000 - networkLatencyTime;

        expect(mockStorage.store).toHaveBeenCalledWith('refresh', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value > expectedRefreshTokenTtl - 1_000 &&
              value < expectedRefreshTokenTtl + 1_000,
          ), // allow 1s clock skew
          data: response.refresh_token,
        });

        expect(mockExtractors[0].update).toHaveBeenCalledWith(testConfig.id, {
          timestamp: expect.any(Number),
          accessTokenResponse: response,
        });
      });
    });

    describe('should fetch access token for authorization_code grant', () => {
      it('respond without refresh token', async () => {
        const now = Date.now();

        const response: AccessTokenResponse = {
          access_token: 'test-token',
          token_type: 'bearer',
          expires_in: 3_600,
        };

        mockClient.fetchAccessToken.mockResolvedValue(response);

        await service.fetch('authorization_code', 'code', 'redirect-uri');

        expect(mockClient.fetchAccessToken).toHaveBeenCalledWith(
          testConfig.accessTokenUrl,
          { id: testConfig.clientId, secret: testConfig.clientSecret },
          {
            grant_type: 'authorization_code',
            code: 'code',
            redirect_uri: 'redirect-uri',
          },
          {
            params: undefined,
            credentialsInParams: false,
          },
        );

        expect(mockStorage.store).toHaveBeenCalledTimes(1);

        expect(mockStorage.store).toHaveBeenCalledWith('access', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value >
                now +
                  response.expires_in! * 1_000 -
                  networkLatencyTime -
                  1_000 &&
              value <
                now + response.expires_in! * 1_000 - networkLatencyTime + 1_000,
          ), // allow 1s clock skew
          data: response,
        });

        expect(mockExtractors[0].update).toHaveBeenCalledWith(testConfig.id, {
          timestamp: expect.any(Number),
          accessTokenResponse: response,
        });
      });

      it('respond with refresh token', async () => {
        const now = Date.now();

        const response: AccessTokenResponse = {
          access_token: 'test-token',
          token_type: 'bearer',
          expires_in: 3_600,
          refresh_token: 'refresh-token',
        };

        mockClient.fetchAccessToken.mockResolvedValue(response);

        await service.fetch('authorization_code', 'code', 'redirect-uri');

        expect(mockClient.fetchAccessToken).toHaveBeenCalledWith(
          testConfig.accessTokenUrl,
          { id: testConfig.clientId, secret: testConfig.clientSecret },
          {
            grant_type: 'authorization_code',
            code: 'code',
            redirect_uri: 'redirect-uri',
          },
          {
            params: undefined,
            credentialsInParams: false,
          },
        );

        expect(mockStorage.store).toHaveBeenCalledTimes(2);

        expect(mockStorage.store).toHaveBeenCalledWith('access', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value >
                now +
                  response.expires_in! * 1_000 -
                  networkLatencyTime -
                  1_000 &&
              value <
                now + response.expires_in! * 1_000 - networkLatencyTime + 1_000,
          ), // allow 1s clock skew
          data: response,
        });

        const refreshTokenTtl = service['config'].refreshTokenTtl;

        assert(typeof refreshTokenTtl === 'number');

        const expectedRefreshTokenTtl =
          now + refreshTokenTtl * 1_000 - networkLatencyTime;

        expect(mockStorage.store).toHaveBeenCalledWith('refresh', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value > expectedRefreshTokenTtl - 1_000 &&
              value < expectedRefreshTokenTtl + 1_000,
          ), // allow 1s clock skew
          data: response.refresh_token,
        });

        expect(mockExtractors[0].update).toHaveBeenCalledWith(testConfig.id, {
          timestamp: expect.any(Number),
          accessTokenResponse: response,
        });
      });
    });

    describe('should fetch access token for refresh_token grant', () => {
      it('respond without refresh token', async () => {
        const now = Date.now();

        const storedRefresh = {
          expiresAt: Date.now() + 10_000,
          data: 'old-refresh',
        };
        mockStorage.load.mockResolvedValueOnce(storedRefresh);

        const response: AccessTokenResponse = {
          access_token: 'new-token',
          token_type: 'bearer',
          expires_in: 3_600,
        };

        mockClient.fetchAccessToken.mockResolvedValue(response);

        await service.fetch('refresh_token');

        expect(mockClient.fetchAccessToken).toHaveBeenCalledWith(
          testConfig.accessTokenUrl,
          { id: testConfig.clientId, secret: testConfig.clientSecret },
          {
            grant_type: 'refresh_token',
            refresh_token: 'old-refresh',
          },
          {
            params: undefined,
            credentialsInParams: false,
          },
        );

        expect(mockStorage.store).toHaveBeenCalledTimes(1);

        expect(mockStorage.store).toHaveBeenCalledWith('access', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value >
                now +
                  response.expires_in! * 1_000 -
                  networkLatencyTime -
                  1_000 &&
              value <
                now + response.expires_in! * 1_000 - networkLatencyTime + 1_000,
          ), // allow 1s clock skew
          data: response,
        });

        expect(mockExtractors[0].update).toHaveBeenCalledWith(testConfig.id, {
          timestamp: expect.any(Number),
          accessTokenResponse: response,
        });
      });

      it('respond with refresh token', async () => {
        const now = Date.now();

        const storedRefresh = {
          expiresAt: Date.now() + 10_000,
          data: 'old-refresh',
        };
        mockStorage.load.mockResolvedValueOnce(storedRefresh);

        const response: AccessTokenResponse = {
          access_token: 'new-token',
          token_type: 'bearer',
          expires_in: 3_600,
          refresh_token: 'refresh-token',
        };

        mockClient.fetchAccessToken.mockResolvedValue(response);

        await service.fetch('refresh_token');

        expect(mockClient.fetchAccessToken).toHaveBeenCalledWith(
          testConfig.accessTokenUrl,
          { id: testConfig.clientId, secret: testConfig.clientSecret },
          {
            grant_type: 'refresh_token',
            refresh_token: 'old-refresh',
          },
          {
            params: undefined,
            credentialsInParams: false,
          },
        );

        expect(mockStorage.store).toHaveBeenCalledTimes(2);

        expect(mockStorage.store).toHaveBeenCalledWith('access', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value >
                now +
                  response.expires_in! * 1_000 -
                  networkLatencyTime -
                  1_000 &&
              value <
                now + response.expires_in! * 1_000 - networkLatencyTime + 1_000,
          ), // allow 1s clock skew
          data: response,
        });

        const refreshTokenTtl = service['config'].refreshTokenTtl;

        assert(typeof refreshTokenTtl === 'number');

        const expectedRefreshTokenTtl =
          now + refreshTokenTtl * 1_000 - networkLatencyTime;

        expect(mockStorage.store).toHaveBeenCalledWith('refresh', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value > expectedRefreshTokenTtl - 1_000 &&
              value < expectedRefreshTokenTtl + 1_000,
          ), // allow 1s clock skew
          data: response.refresh_token,
        });

        expect(mockExtractors[0].update).toHaveBeenCalledWith(testConfig.id, {
          timestamp: expect.any(Number),
          accessTokenResponse: response,
        });
      });
    });

    it('should throw RefreshTokenNotFoundError if no refresh token', async () => {
      mockStorage.load.mockResolvedValue(null);

      await expect(service.fetch('refresh_token')).rejects.toThrow(
        RefreshTokenNotFoundError,
      );
    });

    it('should throw RefreshTokenExpiredError if refresh token expired', async () => {
      mockStorage.load.mockResolvedValue({
        expiresAt: Date.now() - 1_000,
        data: 'expired-refresh',
      });

      await expect(service.fetch('refresh_token')).rejects.toThrow(
        RefreshTokenExpiredError,
      );
    });
  });

  describe('loadAccessTokenResponse', () => {
    it('should return stored access token if valid', async () => {
      const stored = {
        expiresAt: Date.now() + 10_000,
        data: { access_token: 'token' },
      };
      mockStorage.load.mockResolvedValue(stored);

      const result = await service.loadAccessTokenResponse();

      expect(result).toEqual(stored.data);
    });

    it('should refresh if access token expired and refresh available', async () => {
      const expiredAccess = {
        expiresAt: Date.now() - 1_000,
        data: { access_token: 'old' },
      };
      const validRefresh = { expiresAt: Date.now() + 10_000, data: 'refresh' };
      const newResponse: AccessTokenResponse = {
        access_token: 'new',
        token_type: 'bearer',
        expires_in: 3_600,
      };

      let accessCallCount = 0;

      mockStorage.load.mockImplementation(async (key: string) => {
        if (key === 'access') {
          accessCallCount += 1;
          return accessCallCount === 1
            ? expiredAccess
            : {
                expiresAt: Date.now() + 10_000,
                data: newResponse,
              };
        }

        // Always return a valid refresh token if asked
        return validRefresh;
      });

      mockClient.fetchAccessToken.mockResolvedValue(newResponse);

      const result = await service.loadAccessTokenResponse();

      expect(result).toEqual(newResponse);
    });

    it('should return null if no tokens available', async () => {
      mockStorage.load.mockResolvedValue(null);

      const result = await service.loadAccessTokenResponse();

      expect(result).toBeNull();
    });
  });

  describe('loadAccessTokenInfo', () => {
    it('should return token info when access token present', async () => {
      const stored = {
        expiresAt: Date.now() + 10_000,
        data: { access_token: 'token', token_type: 'bearer' },
      };
      mockStorage.load.mockResolvedValue(stored);

      const result = await service.loadAccessTokenInfo();

      expect(result).toEqual({ type: 'bearer', token: 'token' });
    });

    it('should return null when no access token available', async () => {
      mockStorage.load.mockResolvedValue(null);

      const result = await service.loadAccessTokenInfo();

      expect(result).toBeNull();
    });
  });

  describe('responseResource', () => {
    it('should yield access token response when available', async () => {
      const applicationRef = TestBed.inject(ApplicationRef);

      const stored = {
        expiresAt: Date.now() + 10_000,
        data: { access_token: 'token', token_type: 'bearer' },
      };
      mockStorage.load.mockResolvedValue(stored);

      const resource = service.responseResource();

      // Initially there is no token available.
      expect(resource.status()).toEqual('loading' satisfies ResourceStatus);

      await applicationRef.whenStable();

      expect(resource.value()).toEqual(stored.data);
    });

    it('should yield AccessTokenNotFoundError when no access token available', async () => {
      mockStorage.load.mockResolvedValue(null);

      const resource = service.responseResource();

      const applicationRef = TestBed.inject(ApplicationRef);

      // Initially there is no token available.
      expect(resource.status()).toEqual('loading' satisfies ResourceStatus);

      await applicationRef.whenStable();

      expect(resource.error()).toBeInstanceOf(AccessTokenNotFoundError);
    });

    it('should update value when access token becomes available', async () => {
      const tokenResponse: AccessTokenResponse = {
        access_token: 'stream-token',
        token_type: 'bearer',
        expires_in: 3_600,
      };

      let stored: { expiresAt: number; data: AccessTokenResponse } | null =
        null;

      mockStorage.load.mockImplementation(async () => stored);
      mockStorage.store.mockImplementation(async (_key, value) => {
        stored = value as { expiresAt: number; data: AccessTokenResponse };
      });

      mockClient.fetchAccessToken.mockResolvedValue(tokenResponse);

      const resource = service.responseResource();

      const applicationRef = TestBed.inject(ApplicationRef);

      // Initially there is no token available.
      expect(resource.status()).toEqual('loading' satisfies ResourceStatus);

      await applicationRef.whenStable();

      // Trigger a fetch to populate the token.
      await service.fetch('client_credentials');

      await applicationRef.whenStable();

      expect(resource.value()).toEqual(tokenResponse);
    });
  });

  describe('clearTokens', () => {
    it('should clear storage and notify extractors', async () => {
      await service.clearTokens();

      expect(mockStorage.clear).toHaveBeenCalled();
      expect(mockExtractors[0].update).toHaveBeenCalledWith(testConfig.id, {
        timestamp: expect.any(Number),
        accessTokenResponse: expect.any(Symbol), // removedData
      });
    });
  });
});

describe('AccessTokenService: refreshTokenTtl from response claim configuration', () => {
  type AccessTokenResponseWithRefreshTtl = AccessTokenResponse & {
    refresh_token_expires_in?: number;
  };

  const testConfig: AccessTokenConfig = {
    id,
    clientId: 'test-client',
    clientSecret: 'test-secret',
    accessTokenUrl: 'https://example.com/token',
    refreshTokenTtl: 'refresh_token_expires_in',
  };

  let service: AccessTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccessTokenService,
        { provide: APP_ID, useValue: 'test-app' },
        { provide: ACCESS_TOKEN_CONFIG, useValue: testConfig },
        { provide: ACCESS_TOKEN_STORAGE, useValue: mockStorage },
        { provide: ACCESS_TOKEN_RESPONSE_EXTRACTORS, useValue: mockExtractors },
        { provide: Oauth2Client, useValue: mockClient },
      ],
    });

    service = TestBed.inject(AccessTokenService);

    // Reset mocks (also clears mock implementations)
    vi.resetAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetch', () => {
    describe('should fetch access token for client_credentials grant', () => {
      it('respond with refresh token TTL', async () => {
        const now = Date.now();

        const response: AccessTokenResponseWithRefreshTtl = {
          access_token: 'test-token',
          token_type: 'bearer',
          expires_in: 3_600,
          refresh_token: 'refresh-token',
          refresh_token_expires_in: 10_000,
        };

        mockClient.fetchAccessToken.mockResolvedValue(response);

        await service.fetch('client_credentials');

        expect(mockClient.fetchAccessToken).toHaveBeenCalledWith(
          testConfig.accessTokenUrl,
          { id: testConfig.clientId, secret: testConfig.clientSecret },
          { grant_type: 'client_credentials' },
          {
            params: undefined,
            credentialsInParams: false,
          },
        );

        expect(mockStorage.store).toHaveBeenCalledTimes(2);

        expect(mockStorage.store).toHaveBeenCalledWith('access', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value >
                now +
                  response.expires_in! * 1_000 -
                  networkLatencyTime -
                  1_000 &&
              value <
                now + response.expires_in! * 1_000 - networkLatencyTime + 1_000,
          ), // allow 1s clock skew
          data: response,
        });

        const refreshTokenTtl = service['config'].refreshTokenTtl;

        assert(typeof refreshTokenTtl === 'string');

        const expectedRefreshTokenTtl =
          now + response.refresh_token_expires_in! * 1_000 - networkLatencyTime;

        expect(mockStorage.store).toHaveBeenCalledWith('refresh', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value > expectedRefreshTokenTtl - 1_000 &&
              value < expectedRefreshTokenTtl + 1_000,
          ), // allow 1s clock skew
          data: response.refresh_token,
        });

        expect(mockExtractors[0].update).toHaveBeenCalledWith(testConfig.id, {
          timestamp: expect.any(Number),
          accessTokenResponse: response,
        });
      });

      it('respond without refresh token TTL', async () => {
        const now = Date.now();

        const response: AccessTokenResponseWithRefreshTtl = {
          access_token: 'test-token',
          token_type: 'bearer',
          expires_in: 3_600,
          refresh_token: 'refresh-token',
        };

        mockClient.fetchAccessToken.mockResolvedValue(response);

        await service.fetch('client_credentials');

        expect(mockClient.fetchAccessToken).toHaveBeenCalledWith(
          testConfig.accessTokenUrl,
          { id: testConfig.clientId, secret: testConfig.clientSecret },
          { grant_type: 'client_credentials' },
          {
            params: undefined,
            credentialsInParams: false,
          },
        );

        expect(mockStorage.store).toHaveBeenCalledTimes(2);

        expect(mockStorage.store).toHaveBeenCalledWith('access', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value >
                now +
                  response.expires_in! * 1_000 -
                  networkLatencyTime -
                  1_000 &&
              value <
                now + response.expires_in! * 1_000 - networkLatencyTime + 1_000,
          ), // allow 1s clock skew
          data: response,
        });

        const refreshTokenTtl = service['config'].refreshTokenTtl;

        assert(typeof refreshTokenTtl === 'string');

        const expectedRefreshTokenTtl =
          now + defaultRefreshTokenTtl * 1_000 - networkLatencyTime;

        expect(mockStorage.store).toHaveBeenCalledWith('refresh', {
          expiresAt: expect.toSatisfy(
            (value) =>
              value > expectedRefreshTokenTtl - 1_000 &&
              value < expectedRefreshTokenTtl + 1_000,
          ), // allow 1s clock skew
          data: response.refresh_token,
        });

        expect(mockExtractors[0].update).toHaveBeenCalledWith(testConfig.id, {
          timestamp: expect.any(Number),
          accessTokenResponse: response,
        });
      });
    });
  });
});
