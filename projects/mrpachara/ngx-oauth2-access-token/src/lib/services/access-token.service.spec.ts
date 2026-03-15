import { APP_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AccessTokenResponse } from '@mrpachara/ngx-oauth2-access-token/standard';
import { vi } from 'vitest';

import {
  ACCESS_TOKEN_CONFIG,
  ACCESS_TOKEN_RESPONSE_EXTRACTORS,
  ACCESS_TOKEN_STORAGE,
} from '../tokens';
import { createIdKey } from '../tokens/common';
import { AccessTokenConfig } from '../types';
import { AccessTokenService } from './access-token.service';
import { Oauth2Client } from './oauth2.client';

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

const testConfig: AccessTokenConfig = {
  id: createIdKey('test'),
  clientId: 'test-client',
  clientSecret: 'test-secret',
  accessTokenUrl: 'https://example.com/token',
};

describe('AccessTokenService', () => {
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

    // Reset mocks
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetch', () => {
    it('should fetch access token for client_credentials grant', async () => {
      const response: AccessTokenResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        expires_in: 3600,
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

      expect(mockStorage.store).toHaveBeenCalledWith('access', {
        expiresAt: expect.any(Number),
        data: response,
      });

      expect(mockExtractors[0].update).toHaveBeenCalledWith(testConfig.id, {
        timestamp: expect.any(Number),
        accessTokenResponse: response,
      });
    });

    it('should fetch access token for authorization_code grant', async () => {
      const response: AccessTokenResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        expires_in: 3600,
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

      expect(mockStorage.store).toHaveBeenCalledWith('refresh', {
        expiresAt: expect.any(Number),
        data: 'refresh-token',
      });
    });

    it('should fetch access token for refresh_token grant', async () => {
      const storedRefresh = {
        expiresAt: Date.now() + 10000,
        data: 'old-refresh',
      };
      mockStorage.load
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(storedRefresh);

      const response: AccessTokenResponse = {
        access_token: 'new-token',
        token_type: 'bearer',
        expires_in: 3600,
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
    });

    it('should throw RefreshTokenNotFoundError if no refresh token', async () => {
      mockStorage.load.mockResolvedValue(null);

      await expect(service.fetch('refresh_token')).rejects.toThrow(
        'Refresh token not found',
      );
    });
  });

  describe('loadAccessTokenResponse', () => {
    it('should return stored access token if valid', async () => {
      const stored = {
        expiresAt: Date.now() + 10000,
        data: { access_token: 'token' },
      };
      mockStorage.load.mockResolvedValue(stored);

      const result = await service.loadAccessTokenResponse();

      expect(result).toEqual(stored.data);
    });

    it('should refresh if access token expired and refresh available', async () => {
      const expiredAccess = {
        expiresAt: Date.now() - 1000,
        data: { access_token: 'old' },
      };
      const validRefresh = { expiresAt: Date.now() + 10000, data: 'refresh' };
      const newResponse: AccessTokenResponse = {
        access_token: 'new',
        token_type: 'bearer',
        expires_in: 3600,
      };

      mockStorage.load
        .mockResolvedValueOnce(expiredAccess)
        .mockResolvedValueOnce(validRefresh)
        .mockResolvedValueOnce({
          expiresAt: Date.now() + 10000,
          data: newResponse,
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

  // Add more tests as needed for loadAccessTokenInfo, responseResource, etc.
});
