import { APP_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { promisifyRequest } from '@mrpachara/ngx-oauth2-access-token/utility';
import 'fake-indexeddb/auto';
import { libPrefix } from '../../../lib/predefined';
import { STORAGE_VERSION_CHANGED_RELOADER } from '../../../lib/tokens';
import {
  accessTokenObjectStoreName,
  refreshTokenObjectStoreName,
} from './acces-token';
import { AccessTokenIndexedDbConnection } from './access-token-indexed-db.connection';

const appId = 'test-app';
const expectedDbName = `${appId}-${libPrefix}-access-token-storage`;

const mockReloader = vi.fn();

describe('AccessTokenIndexedDbConnection', () => {
  let service: AccessTokenIndexedDbConnection;

  beforeEach(async () => {
    vi.resetAllMocks();

    await promisifyRequest(indexedDB.deleteDatabase(expectedDbName));

    TestBed.configureTestingModule({
      providers: [
        { provide: APP_ID, useValue: appId },
        { provide: STORAGE_VERSION_CHANGED_RELOADER, useValue: mockReloader },
        AccessTokenIndexedDbConnection,
      ],
    });

    service = TestBed.inject(AccessTokenIndexedDbConnection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('IndexedDB', () => {
    it('should create database with correct name', async () => {
      const db = await service.db$;

      expect(db.name).toBe(expectedDbName);
    });

    it('should create object stores', async () => {
      const db = await service.db$;

      expect(db.objectStoreNames.length).toBe(2);
      expect(db.objectStoreNames.contains(accessTokenObjectStoreName)).toBe(
        true,
      );
      expect(db.objectStoreNames.contains(refreshTokenObjectStoreName)).toBe(
        true,
      );
    });

    it('should call reloader on version change', async () => {
      const db = await service.db$;

      const newVersion = db.version + 1;

      db.dispatchEvent(
        new IDBVersionChangeEvent('versionchange', {
          oldVersion: db.version,
          newVersion,
        }),
      );

      expect(mockReloader).toHaveBeenCalledWith({
        serviceName: 'access-token',
        oldVersion: db.version,
        newVersion: newVersion,
      });
    });
  });
});
