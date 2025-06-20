import { inject, Injectable } from '@angular/core';
import { STORAGE_NAME } from '../../tokens';
import { AccessTokenStorage, StoredAccessTokenMap } from '../../types';
import {
  accessTokenObjectStoreName,
  refreshTokenObjectStoreName,
} from './acces-token';
import { AccessTokenIndexedDbConnection } from './access-token-indexed-db.connection';
import { promisifyRequest } from './helpers';

const keys = {
  access: accessTokenObjectStoreName,
  refresh: refreshTokenObjectStoreName,
} as const;

Injectable();
export class AccessTokenIndexedDbStorage implements AccessTokenStorage {
  readonly #connection = inject(AccessTokenIndexedDbConnection);

  readonly #name = inject(STORAGE_NAME);

  async load<const K extends keyof StoredAccessTokenMap>(
    key: K,
  ): Promise<StoredAccessTokenMap[K] | undefined> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(keys[key], 'readonly')
      .objectStore(keys[key]);

    return await promisifyRequest<StoredAccessTokenMap[K] | undefined>(
      objectStore.get(this.#name),
    );
  }

  async store<const K extends keyof StoredAccessTokenMap>(
    key: K,
    data: StoredAccessTokenMap[K],
  ): Promise<StoredAccessTokenMap[K]> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(keys[key], 'readwrite')
      .objectStore(keys[key]);

    await promisifyRequest(objectStore.put(data, this.#name));

    return data;
  }

  async remove<const K extends keyof StoredAccessTokenMap>(
    key: K,
  ): Promise<StoredAccessTokenMap[K] | undefined> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(keys[key], 'readwrite')
      .objectStore(keys[key]);

    const data = await promisifyRequest<StoredAccessTokenMap[K] | undefined>(
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
