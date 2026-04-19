import { APP_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  libPrefix,
  STORAGE_VERSION_CHANGED_RELOADER,
} from '@mrpachara/ngx-oauth2-access-token';
import { promisifyRequest } from '@mrpachara/ngx-oauth2-access-token/utility';
import 'fake-indexeddb/auto';
import { IdTokenIndexedDbConnection } from './id-token-indexed-db.connection';
import {
  idTokenClaimsObjectStoreName,
  idTokenInfoObjectStoreName,
} from './id-tokents';

const appId = 'test-app';
const expectedDbName = `${appId}-${libPrefix}-id-token-storage`;

const mockReloader = vi.fn();

describe('IdTokenIndexedDbConnection', () => {
  let service: IdTokenIndexedDbConnection;

  beforeEach(async () => {
    vi.resetAllMocks();

    await promisifyRequest(indexedDB.deleteDatabase(expectedDbName));

    TestBed.configureTestingModule({
      providers: [
        { provide: APP_ID, useValue: appId },
        { provide: STORAGE_VERSION_CHANGED_RELOADER, useValue: mockReloader },
        IdTokenIndexedDbConnection,
      ],
    });

    service = TestBed.inject(IdTokenIndexedDbConnection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('IndexedDB', () => {
    it('should create database with correct name', async () => {
      const serviceDb = await service.db$;

      const db = await promisifyRequest(indexedDB.open(expectedDbName));

      expect(db.name).toBe(expectedDbName);

      db.close();
      serviceDb.close();
    });

    it('should create object stores', async () => {
      const serviceDb = await service.db$;

      const db = await promisifyRequest(indexedDB.open(expectedDbName));

      expect(db.objectStoreNames.length).toBe(2);
      expect(db.objectStoreNames.contains(idTokenInfoObjectStoreName)).toBe(
        true,
      );
      expect(db.objectStoreNames.contains(idTokenClaimsObjectStoreName)).toBe(
        true,
      );

      db.close();
      serviceDb.close();
    });

    it('should call reloader on version change', async () => {
      const serviceDb = await service.db$;

      const db = await promisifyRequest(
        indexedDB.open(expectedDbName, serviceDb.version + 1),
      );

      expect(mockReloader).toHaveBeenCalledTimes(1);

      expect(mockReloader).toHaveBeenCalledWith({
        serviceName: 'id-token',
        oldVersion: serviceDb.version,
        newVersion: db.version,
      });

      db.close();
      serviceDb.close();
    });
  });
});
