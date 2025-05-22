import { inject, Injectable } from '@angular/core';
import { libPrefix } from '../../predefined';
import { STORAGE_NAME } from '../../tokens';
import { StateStorage, StoredStateData } from '../../types';
import { promisifyRequest, promisifyTransaction } from './helpers';

const storeName = 'states';

Injectable();
export class StateIndexedDbStorage implements StateStorage {
  readonly #db$: Promise<IDBDatabase>;

  constructor() {
    const name = inject(STORAGE_NAME);

    const fullName = `${libPrefix}-${name}-state-storage` as const;

    const dbOpenRequest = indexedDB.open(fullName, 1);

    this.#db$ = new Promise<IDBDatabase>((resolve, reject) => {
      const ac = new AbortController();

      dbOpenRequest.addEventListener(
        'upgradeneeded',
        (ev) => {
          const db = dbOpenRequest.result;

          // NOTE: migration prcesses
          switch (ev.oldVersion) {
            case 0: {
              const objectStore = db.createObjectStore(storeName);
              objectStore.createIndex('expiresAtIndex', 'expiresAt');
            }
          }
        },
        { signal: ac.signal },
      );

      dbOpenRequest.addEventListener(
        'success',
        () => {
          ac.abort();

          const db = dbOpenRequest.result;

          db.addEventListener('versionchange', () => db.close());

          resolve(db);
        },
        { signal: ac.signal },
      );

      dbOpenRequest.addEventListener(
        'error',
        () => {
          ac.abort();

          reject(dbOpenRequest.error);
        },
        { signal: ac.signal },
      );
    });
  }

  async removeExpired(): Promise<void> {
    const db = await this.#db$;

    return void (await promisifyTransaction(
      db.transaction(storeName, 'readwrite'),
      async (transaction) => {
        const objectStore = transaction.objectStore(storeName);
        const expiresAtIndex = objectStore.index('expiresAtIndex');
        const keys = await promisifyRequest(
          expiresAtIndex.getAllKeys(IDBKeyRange.upperBound(Date.now(), true)),
        );

        // NOTE: Do not need to promisify here. Just let the transaction complete.
        keys.forEach((key) => objectStore.delete(key));
      },
    ));
  }

  async load<T = unknown>(
    key: string,
  ): Promise<StoredStateData<T> | undefined> {
    const db = await this.#db$;

    const objectStore = db
      .transaction(storeName, 'readonly')
      .objectStore(storeName);

    return await promisifyRequest<StoredStateData<T> | undefined>(
      objectStore.get(key),
    );
  }

  async store<T = unknown>(
    key: string,
    data: StoredStateData<T>,
  ): Promise<StoredStateData<T>> {
    const db = await this.#db$;

    const objectStore = db
      .transaction(storeName, 'readwrite')
      .objectStore(storeName);

    await promisifyRequest(objectStore.put(data, key));

    return data;
  }

  async remove<T = unknown>(
    key: string,
  ): Promise<StoredStateData<T> | undefined> {
    const db = await this.#db$;

    const objectStore = db
      .transaction(storeName, 'readwrite')
      .objectStore(storeName);

    const data = await promisifyRequest<StoredStateData<T> | undefined>(
      objectStore.get(key),
    );

    if (data) {
      await promisifyRequest(objectStore.delete(key));
    }

    return data;
  }
}
