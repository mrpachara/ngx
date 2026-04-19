import { APP_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { promisifyRequest } from '@mrpachara/ngx-oauth2-access-token/utility';
import 'fake-indexeddb/auto';
import { libPrefix } from '../../../lib/predefined';
import { STORAGE_VERSION_CHANGED_RELOADER } from '../../../lib/tokens';
import { stateObjectStoreName } from './state';
import { StateIndexedDbConnection } from './state-indexed-db.connection';

const appId = 'test-app';
const expectedDbName = `${appId}-${libPrefix}-state-storage`;

const mockReloader = vi.fn();

describe('StateIndexedDbConnection', () => {
  let service: StateIndexedDbConnection;

  beforeEach(async () => {
    vi.resetAllMocks();

    await promisifyRequest(indexedDB.deleteDatabase(expectedDbName));

    TestBed.configureTestingModule({
      providers: [
        { provide: APP_ID, useValue: appId },
        { provide: STORAGE_VERSION_CHANGED_RELOADER, useValue: mockReloader },
        StateIndexedDbConnection,
      ],
    });

    service = TestBed.inject(StateIndexedDbConnection);
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

      expect(db.objectStoreNames.length).toBe(1);
      expect(db.objectStoreNames.contains(stateObjectStoreName)).toBe(true);

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
        serviceName: 'state',
        oldVersion: serviceDb.version,
        newVersion: db.version,
      });

      db.close();
      serviceDb.close();
    });
  });
});
