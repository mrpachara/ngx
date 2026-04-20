import { Injectable, inject } from '@angular/core';
import { promisifyRequest } from '@mrpachara/ngx-oauth2-access-token/utility';
import { STORAGE_NAME } from '../../../lib/tokens';
import { AccessTokenStorage, StoredAccessTokenMap } from '../../../lib/types';
import {
  accessTokenObjectStoreName,
  refreshTokenObjectStoreName,
} from './acces-token';
import { AccessTokenIndexedDbConnection } from './access-token-indexed-db.connection';

const keys = {
  access: accessTokenObjectStoreName,
  refresh: refreshTokenObjectStoreName,
} as const;

Injectable({
  providedIn: 'root',
});
export class AccessTokenIndexedDbStorage implements AccessTokenStorage {
  readonly #connection = inject(AccessTokenIndexedDbConnection);

  readonly #name = inject(STORAGE_NAME);

  async load<const K extends keyof StoredAccessTokenMap>(
    key: K,
  ): Promise<StoredAccessTokenMap[K] | null> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(keys[key], 'readonly')
      .objectStore(keys[key]);

    return (
      (await promisifyRequest<StoredAccessTokenMap[K] | undefined>(
        objectStore.get(this.#name),
      )) ?? null
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
  ): Promise<StoredAccessTokenMap[K] | null> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(keys[key], 'readwrite')
      .objectStore(keys[key]);

    const data =
      (await promisifyRequest<StoredAccessTokenMap[K] | undefined>(
        objectStore.get(this.#name),
      )) ?? null;

    if (data !== null) {
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
