import { APP_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { promisifyRequest } from '@mrpachara/ngx-oauth2-access-token/utility';
import 'fake-indexeddb/auto';
import { libPrefix } from '../../../lib/predefined';
import {
  STORAGE_NAME,
  STORAGE_VERSION_CHANGED_RELOADER,
  createIdKey,
} from '../../../lib/tokens';
import { StoredAccessTokenMap } from '../../../lib/types';
import {
  accessTokenObjectStoreName,
  refreshTokenObjectStoreName,
} from './acces-token';
import { AccessTokenIndexedDbConnection } from './access-token-indexed-db.connection';
import { AccessTokenIndexedDbStorage } from './access-token-indexed-db.storage';

const appId = 'test-app';
const expectedDbName = `${appId}-${libPrefix}-access-token-storage`;
const id = createIdKey('test-access-token-indexed-db-storage-id');

const mockReloader = vi.fn();

async function putData<S extends keyof StoredAccessTokenMap>(
  storeName: S,
  entries: readonly (readonly [key: string, data: StoredAccessTokenMap[S]])[],
): Promise<void> {
  const objectStoreName =
    storeName === 'access'
      ? accessTokenObjectStoreName
      : refreshTokenObjectStoreName;

  const db = await promisifyRequest(indexedDB.open(expectedDbName));

  const objectStore = db
    .transaction(objectStoreName, 'readwrite')
    .objectStore(objectStoreName);

  await Promise.all(
    entries.map(([key, data]) => promisifyRequest(objectStore.put(data, key))),
  );

  db.close();
}

async function getData<S extends keyof StoredAccessTokenMap>(
  storeName: S,
  keys: readonly string[],
): Promise<readonly (StoredAccessTokenMap[S] | undefined)[]> {
  const objectStoreName =
    storeName === 'access'
      ? accessTokenObjectStoreName
      : refreshTokenObjectStoreName;

  const db = await promisifyRequest(indexedDB.open(expectedDbName));

  const objectStore = db
    .transaction(objectStoreName, 'readwrite')
    .objectStore(objectStoreName);

  const result = await Promise.all(
    keys.map((key) =>
      promisifyRequest<StoredAccessTokenMap[S] | undefined>(
        objectStore.get(key),
      ),
    ),
  );

  db.close();

  return result;
}

describe('AccessTokenIndexedDbStorage', () => {
  const existingAccessToken: StoredAccessTokenMap['access'] = {
    expiresAt: Date.now() + 3_600 * 1_000,
    data: {
      access_token: 'test-existing-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    },
  };

  const otherAccessToken: StoredAccessTokenMap['access'] = {
    expiresAt: Date.now() + 3_600 * 1_000,
    data: {
      access_token: 'other-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    },
  };

  const storingAccessToken: StoredAccessTokenMap['access'] = {
    expiresAt: Date.now() + 3_600 * 1_000,
    data: {
      access_token: 'storing-test-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    },
  };

  const existingRefreshToken: StoredAccessTokenMap['refresh'] = {
    expiresAt: Date.now() + 7_200 * 1_000,
    data: 'test-existing-refresh-token',
  };

  const otherRefreshToken: StoredAccessTokenMap['refresh'] = {
    expiresAt: Date.now() + 7_200 * 1_000,
    data: 'other-refresh-token',
  };

  let service: AccessTokenIndexedDbStorage;

  beforeEach(async () => {
    vi.resetAllMocks();

    await promisifyRequest(indexedDB.deleteDatabase(expectedDbName));

    TestBed.configureTestingModule({
      providers: [
        { provide: APP_ID, useValue: appId },
        { provide: STORAGE_VERSION_CHANGED_RELOADER, useValue: mockReloader },
        AccessTokenIndexedDbConnection,
        { provide: STORAGE_NAME, useValue: `${id}` },
        AccessTokenIndexedDbStorage,
      ],
    });

    service = TestBed.inject(AccessTokenIndexedDbStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('load', () => {
    it('should load correct existing data from IndexedDB', async () => {
      await putData('access', [
        [`${id}`, existingAccessToken],
        ['other-id', otherAccessToken],
      ]);

      const storedAccessToken = await service.load('access');
      expect(storedAccessToken).toStrictEqual(existingAccessToken);

      const [storedOtherAccessToken] = await getData('access', ['other-id']);
      expect(storedOtherAccessToken).toStrictEqual(otherAccessToken);
    });

    it('should load correct non-existing data from IndexedDB', async () => {
      await putData('access', [['other-id', otherAccessToken]]);

      const storedAccessToken = await service.load('access');
      expect(storedAccessToken).toBeNull();

      const [storedOtherAccessToken] = await getData('access', ['other-id']);
      expect(storedOtherAccessToken).toStrictEqual(otherAccessToken);
    });
  });

  describe('store', () => {
    it('should store a new data to IndexedDB', async () => {
      await putData('access', [['other-id', otherAccessToken]]);

      const result = await service.store('access', storingAccessToken);
      expect(result).toStrictEqual(storingAccessToken);

      const [storedAccessToken, storedOtherAccessToken] = await getData(
        'access',
        [`${id}`, 'other-id'],
      );
      expect(storedAccessToken).toStrictEqual(storingAccessToken);
      expect(storedOtherAccessToken).toStrictEqual(otherAccessToken);
    });

    it('should override correct existing data in IndexedDB', async () => {
      await putData('access', [
        [`${id}`, existingAccessToken],
        ['other-id', otherAccessToken],
      ]);

      const result = await service.store('access', storingAccessToken);
      expect(result).toStrictEqual(storingAccessToken);

      const [storedAccessToken, storedOtherAccessToken] = await getData(
        'access',
        [`${id}`, 'other-id'],
      );
      expect(storedAccessToken).toStrictEqual(storingAccessToken);
      expect(storedOtherAccessToken).toStrictEqual(otherAccessToken);
    });
  });

  describe('remove', () => {
    it('should remove correct existing data from IndexedDB', async () => {
      await putData('access', [
        [`${id}`, existingAccessToken],
        ['other-id', otherAccessToken],
      ]);

      const result = await service.remove('access');
      expect(result).toStrictEqual(existingAccessToken);

      const [storedAccessToken, storedOtherAccessToken] = await getData(
        'access',
        [`${id}`, 'other-id'],
      );
      expect(storedAccessToken).toBeUndefined();
      expect(storedOtherAccessToken).toStrictEqual(otherAccessToken);
    });

    it('should remove correct non-existing data from IndexedDB', async () => {
      await putData('access', [['other-id', otherAccessToken]]);

      const result = await service.remove('access');
      expect(result).toBeNull();

      const [storedAccessToken, storedOtherAccessToken] = await getData(
        'access',
        [`${id}`, 'other-id'],
      );
      expect(storedAccessToken).toBeUndefined();
      expect(storedOtherAccessToken).toStrictEqual(otherAccessToken);
    });
  });

  describe('clear', () => {
    it('should clear all data from IndexedDB', async () => {
      await putData('access', [
        [`${id}`, existingAccessToken],
        ['other-id', otherAccessToken],
      ]);
      await putData('refresh', [
        [`${id}`, existingRefreshToken],
        ['other-id', otherRefreshToken],
      ]);

      await service.clear();

      const [storedAccessToken, storedOtherAccessToken] = await getData(
        'access',
        [`${id}`, 'other-id'],
      );
      expect(storedAccessToken).toBeUndefined();
      expect(storedOtherAccessToken).toStrictEqual(otherAccessToken);

      const [storedRefreshToken, storedOtherRefreshToken] = await getData(
        'refresh',
        [`${id}`, 'other-id'],
      );
      expect(storedRefreshToken).toBeUndefined();
      expect(storedOtherRefreshToken).toStrictEqual(otherRefreshToken);
    });
  });
});
