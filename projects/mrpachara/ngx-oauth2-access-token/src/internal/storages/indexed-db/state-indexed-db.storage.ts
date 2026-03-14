import { inject, Injectable } from '@angular/core';
import {
  promisifyRequest,
  promisifyTransaction,
} from '@mrpachara/ngx-oauth2-access-token/utility';
import { STORAGE_NAME } from '../../../lib/tokens';
import { StateStorage, StoredStateData } from '../../../lib/types';
import { IndexedStateData, stateObjectStoreName } from './state';
import { StateIndexedDbConnection } from './state-indexed-db.connection';

Injectable({
  providedIn: 'root',
});
export class StateIndexedDbStorage implements StateStorage {
  readonly #connection = inject(StateIndexedDbConnection);

  readonly #name = inject(STORAGE_NAME);

  async removeExpired(): Promise<void> {
    const db = await this.#connection.db$;

    return void (await promisifyTransaction(
      db,
      stateObjectStoreName,
      { mode: 'readwrite' },
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

  async load<T = unknown>(state: string): Promise<StoredStateData<T> | null> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(stateObjectStoreName, 'readonly')
      .objectStore(stateObjectStoreName);

    return (
      (
        await promisifyRequest<IndexedStateData<T> | undefined>(
          objectStore.get([this.#name, state]),
        )
      )?.data ?? null
    );
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

  async remove<T = unknown>(state: string): Promise<StoredStateData<T> | null> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(stateObjectStoreName, 'readwrite')
      .objectStore(stateObjectStoreName);

    const indexedData =
      (await promisifyRequest<IndexedStateData<T> | undefined>(
        objectStore.get([this.#name, state]),
      )) ?? null;

    if (indexedData !== null) {
      await promisifyRequest(
        objectStore.delete([indexedData.name, indexedData.state]),
      );
    }

    return indexedData?.data ?? null;
  }
}
