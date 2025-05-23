import { inject, Injectable } from '@angular/core';
import { STORAGE_NAME } from '../../tokens';
import { StateStorage, StoredStateData } from '../../types';
import { promisifyRequest, promisifyTransaction } from './helpers';
import { IndexedStateData, stateObjectStoreName } from './state';
import { StateIndexedDbConnection } from './state-indexed-db.connection';

Injectable();
export class StateIndexedDbStorage implements StateStorage {
  readonly #connection = inject(StateIndexedDbConnection);

  readonly #name = inject(STORAGE_NAME);

  async removeExpired(): Promise<void> {
    const db = await this.#connection.db$;

    return void (await promisifyTransaction(
      db,
      stateObjectStoreName,
      {},
      async (transaction) => {
        const objectStore = transaction.objectStore(stateObjectStoreName);
        const expiresAtIndex = objectStore.index('expires_at');
        const keys = await promisifyRequest(
          expiresAtIndex.getAllKeys(
            IDBKeyRange.bound([this.#name], [this.#name, Date.now()]),
          ),
        );

        // NOTE: Do not need to promisify here. Just let the transaction complete.
        keys.forEach((key) => objectStore.delete(key));
      },
    ));
  }

  async load<T = unknown>(
    state: string,
  ): Promise<StoredStateData<T> | undefined> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(stateObjectStoreName, 'readonly')
      .objectStore(stateObjectStoreName);

    return (
      await promisifyRequest<IndexedStateData<T> | undefined>(
        objectStore.get([this.#name, state]),
      )
    )?.data;
  }

  async store<T = unknown>(
    state: string,
    data: StoredStateData<T>,
  ): Promise<StoredStateData<T>> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(stateObjectStoreName, 'readwrite')
      .objectStore(stateObjectStoreName);

    await promisifyRequest(
      objectStore.put({
        name: this.#name,
        state,
        data,
      } satisfies IndexedStateData<T>),
    );

    return data;
  }

  async remove<T = unknown>(
    state: string,
  ): Promise<StoredStateData<T> | undefined> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(stateObjectStoreName, 'readwrite')
      .objectStore(stateObjectStoreName);

    const indexedData = await promisifyRequest<IndexedStateData<T> | undefined>(
      objectStore.get([this.#name, state]),
    );

    if (typeof indexedData !== 'undefined') {
      await promisifyRequest(
        objectStore.delete([indexedData.name, indexedData.state]),
      );
    }

    return indexedData?.data;
  }
}
