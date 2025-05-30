import { inject, Injectable } from '@angular/core';
import { STORAGE_NAME } from '../../tokens';
import {
  IdTokenStorage,
  StoredIdTokenInfoMap,
} from '../../types/storages/id-token';
import { promisifyRequest } from './helpers';
import { IdTokenIndexedDbConnection } from './id-token-indexed-db.connection';
import {
  idTokenClaimsObjectStoreName,
  idTokenInfoObjectStoreName,
} from './id-tokents';

const keys = {
  info: idTokenInfoObjectStoreName,
  claims: idTokenClaimsObjectStoreName,
} as const;

@Injectable({
  providedIn: 'root',
})
export class IdTokenIndexedDbStorage implements IdTokenStorage {
  readonly #connection = inject(IdTokenIndexedDbConnection);

  readonly #name = inject(STORAGE_NAME);

  async load<const K extends keyof StoredIdTokenInfoMap>(
    key: K,
  ): Promise<StoredIdTokenInfoMap[K] | undefined> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(keys[key], 'readonly')
      .objectStore(keys[key]);

    return await promisifyRequest<StoredIdTokenInfoMap[K] | undefined>(
      objectStore.get(this.#name),
    );
  }

  async store<const K extends keyof StoredIdTokenInfoMap>(
    key: K,
    data: StoredIdTokenInfoMap[K],
  ): Promise<StoredIdTokenInfoMap[K]> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(keys[key], 'readwrite')
      .objectStore(keys[key]);

    await promisifyRequest(objectStore.put(data, this.#name));

    return data;
  }

  async remove<const K extends keyof StoredIdTokenInfoMap>(
    key: K,
  ): Promise<StoredIdTokenInfoMap[K] | undefined> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(keys[key], 'readwrite')
      .objectStore(keys[key]);

    const data = await promisifyRequest<StoredIdTokenInfoMap[K] | undefined>(
      objectStore.get(this.#name),
    );

    if (typeof data !== 'undefined') {
      await promisifyRequest(objectStore.delete(this.#name));
    }

    return data;
  }

  async clear(): Promise<void> {
    const db = await this.#connection.db$;

    const transaction = db.transaction(Object.values(keys), 'readwrite');

    return void (await Promise.all(
      Array.from(transaction.objectStoreNames).map((objectStoreName) =>
        promisifyRequest(
          transaction.objectStore(objectStoreName).delete(this.#name),
        ),
      ),
    ));
  }
}
