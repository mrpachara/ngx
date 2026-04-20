import { APP_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  STORAGE_VERSION_CHANGED_RELOADER,
  createIdKey,
  libPrefix,
} from '@mrpachara/ngx-oauth2-access-token';
import { promisifyRequest } from '@mrpachara/ngx-oauth2-access-token/utility';
import 'fake-indexeddb/auto';
import { StoredIdTokenKeyMap } from '../../../lib/types';
import { IdTokenIndexedDbConnection } from './id-token-indexed-db.connection';
import { IdTokenIndexedDbStorage } from './id-token-indexed-db.storage';
import {
  idTokenClaimsObjectStoreName,
  idTokenInfoObjectStoreName,
} from './id-tokents';

const appId = 'test-app';
const expectedDbName = `${appId}-${libPrefix}-id-token-storage`;
const id = createIdKey('test-id-token-indexed-db-storage-id');

const mockReloader = vi.fn();

async function putData<S extends keyof StoredIdTokenKeyMap>(
  storeName: S,
  entries: [key: string, data: StoredIdTokenKeyMap[S]][],
): Promise<void> {
  const objectStoreName =
    storeName === 'info'
      ? idTokenInfoObjectStoreName
      : idTokenClaimsObjectStoreName;

  const db = await promisifyRequest(indexedDB.open(expectedDbName));

  const objectStore = db
    .transaction(objectStoreName, 'readwrite')
    .objectStore(objectStoreName);

  await Promise.all(
    entries.map(([key, data]) => promisifyRequest(objectStore.put(data, key))),
  );

  db.close();
}

async function getData<S extends keyof StoredIdTokenKeyMap>(
  storeName: S,
  keys: string[],
): Promise<(StoredIdTokenKeyMap[S] | undefined)[]> {
  const objectStoreName =
    storeName === 'info'
      ? idTokenInfoObjectStoreName
      : idTokenClaimsObjectStoreName;

  const db = await promisifyRequest(indexedDB.open(expectedDbName));

  const objectStore = db
    .transaction(objectStoreName, 'readwrite')
    .objectStore(objectStoreName);

  const result = await Promise.all(
    keys.map((key) =>
      promisifyRequest<StoredIdTokenKeyMap[S] | undefined>(
        objectStore.get(key),
      ),
    ),
  );

  db.close();

  return result;
}

describe('IdTokenIndexedDbStorage', () => {
  const existingIdToken: StoredIdTokenKeyMap['info'] = {
    serial: 'test-serial-header.test-serial-payload.test-serial-signature',
    header: {
      alg: 'RS256',
      typ: 'JWT',
    },
    signature: new Uint8Array([1, 2, 3]),
    protectedContent: new Uint8Array([4, 5, 6]),
    payload: {
      iss: 'https://example.com',
      sub: '1234567890',
      aud: 'client-id',
      exp: Math.floor(Date.now() / 1_000) + 3_600,
      iat: Math.floor(Date.now() / 1_000),
    },
  };

  const otherIdToken: StoredIdTokenKeyMap['info'] = {
    serial: 'other-serial-header.other-serial-payload.other-serial-signature',
    header: {
      alg: 'RS256',
      typ: 'JWT',
    },
    signature: new Uint8Array([7, 8, 9]),
    protectedContent: new Uint8Array([10, 11, 12]),
    payload: {
      iss: 'https://example.com',
      sub: '0987654321',
      aud: 'client-id',
      exp: Math.floor(Date.now() / 1_000) + 3_600,
      iat: Math.floor(Date.now() / 1_000),
    },
  };

  const storingIdToken: StoredIdTokenKeyMap['info'] = {
    serial:
      'storing-serial-header.storing-serial-payload.storing-serial-signature',
    header: {
      alg: 'RS256',
      typ: 'JWT',
    },
    signature: new Uint8Array([1, 2, 3]),
    protectedContent: new Uint8Array([4, 5, 6]),
    payload: {
      iss: 'https://example.com',
      sub: '1234567890',
      aud: 'client-id',
      exp: Math.floor(Date.now() / 1_000) + 3_600,
      iat: Math.floor(Date.now() / 1_000),
    },
  };

  const existingIdTokenClaims: StoredIdTokenKeyMap['claims'] = {
    iss: 'https://example.com',
    sub: '1234567890',
    aud: 'client-id',
    exp: Math.floor(Date.now() / 1_000) + 3_600,
    iat: Math.floor(Date.now() / 1_000),
  };

  const otherIdTokenClaims: StoredIdTokenKeyMap['claims'] = {
    iss: 'https://example.com',
    sub: '0987654321',
    aud: 'client-id',
    exp: Math.floor(Date.now() / 1_000) + 3_600,
    iat: Math.floor(Date.now() / 1_000),
  };

  let service: IdTokenIndexedDbStorage;

  beforeEach(async () => {
    vi.resetAllMocks();

    await promisifyRequest(indexedDB.deleteDatabase(expectedDbName));

    TestBed.configureTestingModule({
      providers: [
        { provide: APP_ID, useValue: appId },
        { provide: STORAGE_VERSION_CHANGED_RELOADER, useValue: mockReloader },
        IdTokenIndexedDbConnection,
        IdTokenIndexedDbStorage,
      ],
    });
    service = TestBed.inject(IdTokenIndexedDbStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('load', () => {
    it('should load correct existing data from IndexedDB', async () => {
      await putData('info', [
        [`${id}`, existingIdToken],
        ['other-id', otherIdToken],
      ]);

      const storedIdToken = await service.load(id, 'info');
      expect(JSON.parse(JSON.stringify(storedIdToken))).toStrictEqual(
        JSON.parse(JSON.stringify(existingIdToken)),
      );

      const [storedOtherIdToken] = await getData('info', ['other-id']);
      expect(JSON.parse(JSON.stringify(storedOtherIdToken))).toStrictEqual(
        JSON.parse(JSON.stringify(otherIdToken)),
      );
    });

    it('should load correct non-existing data from IndexedDB', async () => {
      await putData('info', [['other-id', otherIdToken]]);

      const storedIdToken = await service.load(id, 'info');
      expect(storedIdToken).toBeNull();

      const [storedOtherIdToken] = await getData('info', ['other-id']);
      expect(JSON.parse(JSON.stringify(storedOtherIdToken))).toStrictEqual(
        JSON.parse(JSON.stringify(otherIdToken)),
      );
    });
  });

  describe('store', () => {
    it('should store a new data to IndexedDB', async () => {
      await putData('info', [['other-id', otherIdToken]]);

      const result = await service.store(id, 'info', storingIdToken);
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(
        JSON.parse(JSON.stringify(storingIdToken)),
      );

      const [storedIdToken, storedOtherIdToken] = await getData('info', [
        `${id}`,
        'other-id',
      ]);
      expect(JSON.parse(JSON.stringify(storedIdToken))).toStrictEqual(
        JSON.parse(JSON.stringify(storingIdToken)),
      );
      expect(JSON.parse(JSON.stringify(storedOtherIdToken))).toStrictEqual(
        JSON.parse(JSON.stringify(otherIdToken)),
      );
    });

    it('should override correct existing data in IndexedDB', async () => {
      await putData('info', [
        [`${id}`, existingIdToken],
        ['other-id', otherIdToken],
      ]);

      const result = await service.store(id, 'info', storingIdToken);
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(
        JSON.parse(JSON.stringify(storingIdToken)),
      );

      const [storedIdToken, storedOtherIdToken] = await getData('info', [
        `${id}`,
        'other-id',
      ]);
      expect(JSON.parse(JSON.stringify(storedIdToken))).toStrictEqual(
        JSON.parse(JSON.stringify(storingIdToken)),
      );
      expect(JSON.parse(JSON.stringify(storedOtherIdToken))).toStrictEqual(
        JSON.parse(JSON.stringify(otherIdToken)),
      );
    });
  });

  describe('remove', () => {
    it('should remove correct existing data from IndexedDB', async () => {
      await putData('info', [
        [`${id}`, existingIdToken],
        ['other-id', otherIdToken],
      ]);

      const result = await service.remove(id, 'info');
      expect(JSON.parse(JSON.stringify(result))).toStrictEqual(
        JSON.parse(JSON.stringify(existingIdToken)),
      );

      const [storedIdToken, storedOtherIdToken] = await getData('info', [
        `${id}`,
        'other-id',
      ]);
      expect(storedIdToken).toBeUndefined();
      expect(JSON.parse(JSON.stringify(storedOtherIdToken))).toStrictEqual(
        JSON.parse(JSON.stringify(otherIdToken)),
      );
    });

    it('should remove correct non-existing data from IndexedDB', async () => {
      await putData('info', [['other-id', otherIdToken]]);

      const result = await service.remove(id, 'info');
      expect(result).toBeNull();

      const [storedIdToken, storedOtherIdToken] = await getData('info', [
        `${id}`,
        'other-id',
      ]);
      expect(storedIdToken).toBeUndefined();
      expect(JSON.parse(JSON.stringify(storedOtherIdToken))).toStrictEqual(
        JSON.parse(JSON.stringify(otherIdToken)),
      );
    });
  });

  describe('clear', () => {
    it('should clear all data from IndexedDB', async () => {
      await putData('info', [
        [`${id}`, existingIdToken],
        ['other-id', otherIdToken],
      ]);
      await putData('claims', [
        [`${id}`, existingIdTokenClaims],
        ['other-id', otherIdTokenClaims],
      ]);

      await service.clear(id);

      const [storedIdToken, storedOtherIdToken] = await getData('info', [
        `${id}`,
        'other-id',
      ]);
      expect(storedIdToken).toBeUndefined();
      expect(JSON.parse(JSON.stringify(storedOtherIdToken))).toStrictEqual(
        JSON.parse(JSON.stringify(otherIdToken)),
      );

      const [storedIdTokenClaims, storedOtherIdTokenClaims] = await getData(
        'claims',
        [`${id}`, 'other-id'],
      );
      expect(storedIdTokenClaims).toBeUndefined();
      expect(
        JSON.parse(JSON.stringify(storedOtherIdTokenClaims)),
      ).toStrictEqual(JSON.parse(JSON.stringify(otherIdTokenClaims)));
    });
  });
});
