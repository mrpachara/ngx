import { APP_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { promisifyRequest } from '@mrpachara/ngx-oauth2-access-token/utility';
import 'fake-indexeddb/auto';
import { libPrefix } from '../../../lib/predefined';
import {
  createIdKey,
  STORAGE_NAME,
  STORAGE_VERSION_CHANGED_RELOADER,
} from '../../../lib/tokens';
import { StoredStateData } from '../../../lib/types';
import { IndexedStateData, stateObjectStoreName } from './state';
import { StateIndexedDbConnection } from './state-indexed-db.connection';
import { StateIndexedDbStorage } from './state-indexed-db.storage';

const appId = 'test-app';
const expectedDbName = `${appId}-${libPrefix}-state-storage`;
const id = createIdKey('test-state-indexed-db-storage-id');

const mockReloader = vi.fn();

async function putData<T>(
  state: string,
  data: StoredStateData<T>,
): Promise<void> {
  const db = await promisifyRequest(indexedDB.open(expectedDbName));

  const objectStore = db
    .transaction(stateObjectStoreName, 'readwrite')
    .objectStore(stateObjectStoreName);

  await promisifyRequest(
    objectStore.put({
      name: `${id}`,
      state,
      data,
    }),
  );

  db.close();
}

async function getData<T = unknown>(
  state: string,
): Promise<StoredStateData<T> | undefined> {
  const db = await promisifyRequest(indexedDB.open(expectedDbName));

  const objectStore = db
    .transaction(stateObjectStoreName, 'readonly')
    .objectStore(stateObjectStoreName);

  const value = await promisifyRequest<IndexedStateData<T> | undefined>(
    objectStore.get([`${id}`, state]),
  );

  db.close();

  return value?.data;
}

describe('StateIndexedDbStorage', () => {
  let service: StateIndexedDbStorage;

  beforeEach(async () => {
    vi.resetAllMocks();

    await promisifyRequest(indexedDB.deleteDatabase(expectedDbName));

    TestBed.configureTestingModule({
      providers: [
        { provide: APP_ID, useValue: appId },
        { provide: STORAGE_VERSION_CHANGED_RELOADER, useValue: mockReloader },
        StateIndexedDbConnection,
        { provide: STORAGE_NAME, useValue: `${id}` },
        StateIndexedDbStorage,
      ],
    });

    service = TestBed.inject(StateIndexedDbStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('load', () => {
    it('should load correct existing data from IndexedDB', async () => {
      const existingState: StoredStateData<{ foo: string }> = {
        expiresAt: Date.now() + 3_600 * 1_000,
        data: { foo: 'bar' },
        codeVerifier: 'existing-code-verifier',
      };

      const otherState: StoredStateData<{ foo: string }> = {
        expiresAt: Date.now() + 3_600 * 1_000,
        data: { foo: 'other' },
      };

      await putData('state', existingState);
      await putData('other-state', otherState);

      const storedState = await service.load<{ foo: string }>('state');
      expect(storedState).toStrictEqual(existingState);

      const storedOtherState = await getData<{ foo: string }>('other-state');
      expect(storedOtherState).toStrictEqual(otherState);
    });

    it('should load correct non-existing data from IndexedDB', async () => {
      const otherState: StoredStateData<{ foo: string }> = {
        expiresAt: Date.now() + 3_600 * 1_000,
        data: { foo: 'other' },
      };

      await putData('other-state', otherState);

      const storedState = await service.load('state');
      expect(storedState).toStrictEqual(null);

      const storedOtherState = await getData<{ foo: string }>('other-state');
      expect(storedOtherState).toStrictEqual(otherState);
    });
  });

  describe('store', () => {
    it('should store a new data to IndexedDB', async () => {
      const otherState: StoredStateData<{ foo: string }> = {
        expiresAt: Date.now() + 3_600 * 1_000,
        data: { foo: 'other' },
      };

      await putData('other-state', otherState);

      const storingState: StoredStateData<{ foo: string }> = {
        expiresAt: Date.now() + 3_600 * 1_000,
        data: { foo: 'stored' },
      };

      const result = await service.store('state', storingState);
      expect(result).toStrictEqual(storingState);

      const storedState = await getData<{ foo: string }>('state');
      expect(storedState).toStrictEqual(storingState);

      const storedOtherState = await getData<{ foo: string }>('other-state');
      expect(storedOtherState).toStrictEqual(otherState);
    });

    it('should override correct existing data in IndexedDB', async () => {
      const existingState: StoredStateData<{ foo: string }> = {
        expiresAt: Date.now() + 3_600 * 1_000,
        data: { foo: 'existing' },
      };

      const otherState: StoredStateData<{ foo: string }> = {
        expiresAt: Date.now() + 3_600 * 1_000,
        data: { foo: 'other' },
      };

      await putData('state', existingState);
      await putData('other-state', otherState);

      const storingState: StoredStateData<{ foo: string }> = {
        expiresAt: Date.now() + 3_600 * 1_000,
        data: { foo: 'stored' },
      };

      const result = await service.store('state', storingState);
      expect(result).toStrictEqual(storingState);

      const storedState = await getData<{ foo: string }>('state');
      expect(storedState).toStrictEqual(storingState);

      const storedOtherState = await getData<{ foo: string }>('other-state');
      expect(storedOtherState).toStrictEqual(otherState);
    });
  });

  describe('remove', () => {
    it('should remove correct existing data from IndexedDB', async () => {
      const existingState: StoredStateData<{ foo: string }> = {
        expiresAt: Date.now() + 3_600 * 1_000,
        data: { foo: 'existing' },
      };

      const otherState: StoredStateData<{ foo: string }> = {
        expiresAt: Date.now() + 3_600 * 1_000,
        data: { foo: 'other' },
      };

      await putData('state', existingState);
      await putData('other-state', otherState);

      const result = await service.remove('state');
      expect(result).toStrictEqual(existingState);

      const storedState = await getData<{ foo: string }>('state');
      expect(storedState).toBeUndefined();

      const storedOtherState = await getData<{ foo: string }>('other-state');
      expect(storedOtherState).toStrictEqual(otherState);
    });

    it('should remove correct non-existing data from IndexedDB', async () => {
      const otherState: StoredStateData<{ foo: string }> = {
        expiresAt: Date.now() + 3_600 * 1_000,
        data: { foo: 'other' },
      };

      await putData('other-state', otherState);

      const result = await service.remove('state');
      expect(result).toBeNull();

      const storedState = await getData<{ foo: string }>('state');
      expect(storedState).toBeUndefined();

      const storedOtherState = await getData<{ foo: string }>('other-state');
      expect(storedOtherState).toStrictEqual(otherState);
    });
  });

  describe('removeExpired', () => {
    it('should remove only expired data from IndexedDB', async () => {
      const now = Date.now();

      const expiredState: StoredStateData<{ foo: string }> = {
        expiresAt: now - 1_000,
        data: { foo: 'expired' },
      };

      const futureState: StoredStateData<{ foo: string }> = {
        expiresAt: now + 10_000,
        data: { foo: 'future' },
      };

      await putData('expired', expiredState);
      await putData('future', futureState);

      await service.removeExpired();

      const storedExpired = await getData<{ foo: string }>('expired');
      expect(storedExpired).toBeUndefined();

      const storedFuture = await getData<{ foo: string }>('future');
      expect(storedFuture).toStrictEqual(futureState);
    });
  });
});
