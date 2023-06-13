import { Injectable, inject } from '@angular/core';

import { libPrefix } from '../../predefined';
import { STORAGE_INFO } from '../../tokens';
import { KeyValuePairStorage, KeyValuePairStorageFactory } from '../../types';
import { Observable, Subject, filter, pipe, switchMap } from 'rxjs';

type ChangedData = {
  storageName: string;
  key: string;
};

function promiseWrapper<T = unknown>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });
}

class IndexedDbStorage implements KeyValuePairStorage {
  private readonly storageKey = (key: string) =>
    `${this.storageName}-${key}` as const;

  private readonly keyObservableMap = new Map<string, Observable<unknown>>();

  get name() {
    return this.storageName;
  }

  constructor(
    private readonly storageName: string,
    private readonly db: Promise<IDBDatabase>,
    private readonly storeObjectName: string,
    private readonly storageEvent$: Observable<ChangedData>,
    private readonly emitStorageEvent: (key: string) => void,
  ) {}

  // TODO: move fillter logic to factory
  private readonly newTransformerPipe = <T = unknown>(key: string) => {
    return pipe(
      filter(
        (storageEvent: ChangedData) =>
          storageEvent.storageName === this.storageName &&
          storageEvent.key === key,
      ),
      switchMap(() => this.loadItem<T>(key)),
    );
  };

  async loadItem<T = unknown>(key: string): Promise<T | null> {
    const db = await this.db;
    const storageKey = this.storageKey(key);

    const transaction = db.transaction(this.storeObjectName, 'readonly');
    const storage = transaction.objectStore(this.storeObjectName);

    // TODO: deepFreeze()
    return (await promiseWrapper<T>(storage.get(storageKey))) ?? null;
  }

  async storeItem<T = unknown>(key: string, value: T): Promise<T> {
    const db = await this.db;
    const storageKey = this.storageKey(key);

    const transaction = db.transaction(this.storeObjectName, 'readwrite');
    const storage = transaction.objectStore(this.storeObjectName);
    await promiseWrapper(storage.put(value, storageKey));

    this.emitStorageEvent(key);

    // TODO: deepFreeze()
    return await promiseWrapper<T>(storage.get(storageKey));
  }

  async removeItem<T = unknown>(key: string): Promise<T | null> {
    const db = await this.db;
    const storageKey = this.storageKey(key);

    const transaction = db.transaction(this.storeObjectName, 'readwrite');
    const storage = transaction.objectStore(this.storeObjectName);
    const value = (await promiseWrapper<T>(storage.get(storageKey))) ?? null;
    await promiseWrapper(storage.delete(storageKey));

    this.emitStorageEvent(key);

    // TODO: deepFreeze()
    return value;
  }

  watchItem<T = unknown>(key: string): Observable<T | null> {
    if (!this.keyObservableMap.has(key)) {
      this.keyObservableMap.set(
        key,
        this.storageEvent$.pipe(
          // NOTE: ChangedData pass separated key name and storage name.
          //       So just pass the key name.
          this.newTransformerPipe<T>(key),
        ),
      );
    }

    return this.keyObservableMap.get(key) as Observable<T>;
  }

  async keys(): Promise<string[]> {
    const db = await this.db;

    const prefix = this.storageKey('');
    const prefixLength = prefix.length;

    const transaction = db.transaction(this.storeObjectName, 'readonly');
    const storage = transaction.objectStore(this.storeObjectName);

    // TODO: move fillter logic to factory
    return (await promiseWrapper(storage.getAllKeys()))
      .map((rawKey) => `${rawKey}`)
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefixLength));
  }
}

const dbPrefix = libPrefix;
const storeObjectName = 'key-value-pair';
const broadcastPrefix = `${libPrefix}-indexed-db`;

@Injectable({
  providedIn: 'root',
})
export class IndexedDbStorageFactory implements KeyValuePairStorageFactory {
  private readonly storageInfo = inject(STORAGE_INFO);

  private readonly broadcastName = `${broadcastPrefix}-${this.storageInfo.name}`;
  private broadcastChannel = new BroadcastChannel(this.broadcastName);

  private readonly dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const dbName = `${dbPrefix}-${this.storageInfo.name}`;
    const request = indexedDB.open(dbName, this.storageInfo.version);

    request.addEventListener('upgradeneeded', () => {
      const db = request.result;

      if (db.objectStoreNames.contains(storeObjectName)) {
        db.deleteObjectStore(storeObjectName);
      }

      db.createObjectStore(storeObjectName);
    });

    request.addEventListener('success', () => {
      resolve(request.result);
    });

    request.addEventListener('error', () => {
      reject(request.error);
    });
  });

  private crateEmitter(storageName: string): (key: string) => void {
    return (key: string) => {
      this.broadcastChannel.postMessage({
        storageName,
        key,
      } as ChangedData);
    };
  }

  private readonly storageEvent$: Observable<ChangedData>;
  private readonly emitStorageEvent = (changedData: ChangedData): void => {
    this.broadcastChannel.postMessage(changedData);
  };

  constructor() {
    // NOTE: Subject is a multicast observable.
    const storageEventSubject = new Subject<ChangedData>();
    this.storageEvent$ = storageEventSubject.asObservable();

    this.broadcastChannel.addEventListener(
      'message',
      (ev: MessageEvent<ChangedData>) => {
        storageEventSubject.next(ev.data);
      },
    );
  }

  create(storageName: string): KeyValuePairStorage {
    return new IndexedDbStorage(
      storageName,
      this.dbPromise,
      storeObjectName,
      this.storageEvent$,
      this.crateEmitter(storageName),
    );
  }
}
