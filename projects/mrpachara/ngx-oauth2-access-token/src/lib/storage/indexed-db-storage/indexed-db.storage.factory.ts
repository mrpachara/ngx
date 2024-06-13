import { Injectable, inject } from '@angular/core';
import { Observable, Subject, filter, switchMap } from 'rxjs';

import { deepFreeze } from '../../functions';
import { libPrefix } from '../../predefined';
import { STORAGE_INFO } from '../../tokens';
import {
  DeepReadonly,
  KeyValuePairsStorage,
  KeyValuePairsStorageFactory,
} from '../../types';

function promiseWrapper<T = unknown>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });
}

/** IndexedDB storage */
class IndexedDbStorage implements KeyValuePairsStorage {
  private readonly keyObservableMap = new Map<string, Observable<unknown>>();

  get name() {
    return this.storageName;
  }

  constructor(
    private readonly storageName: string,
    private readonly storageKey: (key: string) => string,
    private readonly db: Promise<IDBDatabase>,
    private readonly storageEvent$: Observable<string | null>,
    private readonly storeObject: (
      db: IDBDatabase,
      mode: IDBTransactionMode,
    ) => IDBObjectStore,
    private readonly emitKey: (key: string) => void,
  ) {}

  async loadItem<T = unknown>(key: string): Promise<DeepReadonly<T | null>> {
    const db = await this.db;
    const storageKey = this.storageKey(key);

    const storage = this.storeObject(db, 'readonly');

    return deepFreeze(
      (await promiseWrapper<T | undefined>(storage.get(storageKey))) ?? null,
    );
  }

  async storeItem<T = unknown>(
    key: string,
    value: T,
  ): Promise<DeepReadonly<T>> {
    const db = await this.db;
    const storageKey = this.storageKey(key);

    const storage = this.storeObject(db, 'readwrite');
    await promiseWrapper(storage.put(value, storageKey));

    this.emitKey(storageKey);

    return deepFreeze<T>(await promiseWrapper<T>(storage.get(storageKey)));
  }

  async removeItem<T = unknown>(key: string): Promise<DeepReadonly<T | null>> {
    const db = await this.db;
    const storageKey = this.storageKey(key);

    const storage = this.storeObject(db, 'readwrite');
    const value = deepFreeze(
      (await promiseWrapper<T>(storage.get(storageKey))) ?? null,
    );
    await promiseWrapper(storage.delete(storageKey));

    this.emitKey(storageKey);

    return value;
  }

  watchItem<T = unknown>(key: string): Observable<DeepReadonly<T | null>> {
    if (!this.keyObservableMap.has(key)) {
      this.keyObservableMap.set(
        key,
        this.storageEvent$.pipe(
          filter(
            (eventKey) =>
              eventKey === null || eventKey === this.storageKey(key),
          ),
          switchMap(async () => await this.loadItem<T>(key)),
        ),
      );
    }

    return this.keyObservableMap.get(key) as Observable<DeepReadonly<T>>;
  }

  async keys(): Promise<string[]> {
    const db = await this.db;

    const storagePrefix = this.storageKey('');
    const storagePrefixLenght = storagePrefix.length;

    const storage = this.storeObject(db, 'readonly');

    return (await promiseWrapper(storage.getAllKeys()))
      .map((rawKey) => `${rawKey}`)
      .filter((key) => key.startsWith(storagePrefix))
      .map((key) => key.slice(storagePrefixLenght));
  }
}

interface ChangedKey {
  key: string | null;
}

const dbPrefix = libPrefix;
const storeObjectName = 'key-value-pairs' as const;
const broadcastPrefix = `${libPrefix}-indexed-db` as const;

/** IndexedDB storage factory */
@Injectable({
  providedIn: 'root',
})
export class IndexedDbStorageFactory implements KeyValuePairsStorageFactory {
  private readonly storageInfo = inject(STORAGE_INFO);

  private readonly broadcastName =
    `${broadcastPrefix}-${this.storageInfo.name}` as const;
  private broadcastChannel =
    typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(this.broadcastName)
      : null;

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

  private readonly storageEvent$: Observable<string | null>;
  private readonly emitStorageEvent = (changedData: ChangedKey): void => {
    this.broadcastChannel?.postMessage(changedData);
  };

  constructor() {
    // NOTE: Subject is a _multicast observable_.
    const storageEventSubject = new Subject<string | null>();
    this.storageEvent$ = storageEventSubject.asObservable();

    this.broadcastChannel?.addEventListener(
      'message',
      (ev: MessageEvent<ChangedKey>) => {
        storageEventSubject.next(ev.data.key);
      },
    );
  }

  async supported(): Promise<void> {
    await this.dbPromise;
  }

  private createStorageKey(storageName: string): (key: string) => string {
    return (key: string) => `${storageName}-${key}` as const;
  }

  private readonly storeObject = (
    db: IDBDatabase,
    mode: IDBTransactionMode,
  ): IDBObjectStore => {
    const transaction = db.transaction(storeObjectName, mode);
    return transaction.objectStore(storeObjectName);
  };

  private readonly emitKey = (key: string) => {
    this.broadcastChannel?.postMessage({
      key,
    } as ChangedKey);
  };

  private readonly storageMap = new Map<string, KeyValuePairsStorage>();

  get(storageName: string): KeyValuePairsStorage {
    if (this.broadcastChannel !== null) {
      if (!this.storageMap.has(storageName)) {
        this.storageMap.set(
          storageName,
          new IndexedDbStorage(
            storageName,
            this.createStorageKey(storageName),
            this.dbPromise,
            this.storageEvent$,
            this.storeObject,
            this.emitKey,
          ),
        );
      }

      return this.storageMap.get(storageName) as KeyValuePairsStorage;
    }

    throw new Error(
      'Unsupported BroadcastChannel, cannot use IndexedDB storage',
    );
  }
}
