import { TestBed } from '@angular/core/testing';
import {
  ACCESS_TOKEN_ID,
  createIdKey,
} from '@mrpachara/ngx-oauth2-access-token';
import {
  ID_TOKEN_CLAIMS_TRANSFORMER,
  ID_TOKEN_STORAGE,
  ID_TOKEN_VERIFICATION,
} from '../tokens';
import { IdTokenExtractor } from './id-token.extractor';

const id = createIdKey('test-id-token-extractor-id');
const validIdToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJpc3N1ZXIiLCJzdWIiOiJzdWJqZWN0IiwiYXVkIjoiYXVkaWVuY2UiLCJleHAiOjIwMDAwMDAwMDAsImlhdCI6MTAwMDAwMDAwMCwiYWIiOjF9.c2lnbmF0dXJl';

const mockStorage = {
  load: vi.fn(),
  store: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
};

const mockVerification = vi.fn();
const mockTransformer = vi.fn((old, curr) => curr);

describe('IdTokenExtractor', () => {
  let service: IdTokenExtractor;

  beforeEach(() => {
    vi.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [
        { provide: ACCESS_TOKEN_ID, useValue: id },
        { provide: ID_TOKEN_STORAGE, useValue: mockStorage },
        { provide: ID_TOKEN_VERIFICATION, useFactory: () => mockVerification },
        { provide: ID_TOKEN_CLAIMS_TRANSFORMER, useValue: mockTransformer },
        IdTokenExtractor,
      ],
    });

    service = TestBed.inject(IdTokenExtractor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('update()', () => {
    // it('should update version on storedData', async () => {
    //   const spy = vi.spyOn(service as any, '#updateVersion');
    //   await service.update(id, {
    //     accessTokenResponse: storedData,
    //     timestamp: 123,
    //   });
    //   expect(spy).toHaveBeenCalledWith(id, 123);
    // });

    // it('should clear storage and update version on removedData', async () => {
    //   const spy = vi.spyOn(service as any, '#updateVersion');
    //   await service.update(id, {
    //     accessTokenResponse: removedData,
    //     timestamp: 456,
    //   });
    //   expect(mockStorage.clear).toHaveBeenCalledWith(id);
    //   expect(spy).toHaveBeenCalledWith(id, 456);
    // });

    it('should process and store valid ID token', async () => {
      await service.update(id, {
        accessTokenResponse: {
          id_token: validIdToken,
          access_token: 'at',
          token_type: 'Bearer',
        },
        timestamp: 789,
      });

      expect(mockVerification).toHaveBeenCalled();
      expect(mockStorage.store).toHaveBeenCalledWith(
        id,
        'info',
        expect.objectContaining({
          payload: expect.objectContaining({ sub: 'subject' }),
        }),
      );
      expect(mockStorage.store).toHaveBeenCalledWith(
        id,
        'claims',
        expect.objectContaining({ sub: 'subject' }),
      );
    });

    it('should handle verification errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation - suppress error output during test
      });
      mockVerification.mockRejectedValue(new Error('Invalid Signature'));

      await service.update(id, {
        accessTokenResponse: {
          id_token: 'invalid',
          access_token: 'at',
          token_type: 'Bearer',
        },
        timestamp: 101,
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('load methods', () => {
    it('should load info from storage', async () => {
      const info = { payload: { sub: '123' } };
      mockStorage.load.mockResolvedValue(info);

      const result = await service.loadInfo(id);
      expect(mockStorage.load).toHaveBeenCalledWith(id, 'info');
      expect(result).toBe(info);
    });

    it('should load claims from storage', async () => {
      const claims = { sub: '123' };
      mockStorage.load.mockResolvedValue(claims);

      const result = await service.loadClaims(id);
      expect(mockStorage.load).toHaveBeenCalledWith(id, 'claims');
      expect(result).toBe(claims);
    });
  });

  describe('resource signals', () => {
    it('should trigger eager loading for infoResource', () => {
      const spy = vi.spyOn(service, 'loadInfo');
      const res = service.infoResource(id);
      expect(res.status()).toBe('loading');
      expect(spy).toHaveBeenCalledWith(id);
    });

    it('should trigger eager loading for claimsResource', () => {
      const spy = vi.spyOn(service, 'loadClaims');
      const res = service.claimsResource(id);
      expect(res.status()).toBe('loading');
      expect(spy).toHaveBeenCalledWith(id);
    });
  });
});
