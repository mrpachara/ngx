import { inject, Injectable } from '@angular/core';
import { IdKey, promisifyRequest } from '@mrpachara/ngx-oauth2-access-token';
import { IdTokenStorage, StoredIdTokenKeyMap } from '../../types';
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

  async load<const K extends keyof StoredIdTokenKeyMap>(
    id: IdKey,
    key: K,
  ): Promise<StoredIdTokenKeyMap[K] | null> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(keys[key], 'readonly')
      .objectStore(keys[key]);

    return (
      (await promisifyRequest<StoredIdTokenKeyMap[K] | undefined>(
        objectStore.get(`${id}`),
      )) ?? null
    );
  }

  async store<const K extends keyof StoredIdTokenKeyMap>(
    id: IdKey,
    key: K,
    data: StoredIdTokenKeyMap[K],
  ): Promise<StoredIdTokenKeyMap[K]> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(keys[key], 'readwrite')
      .objectStore(keys[key]);

    await promisifyRequest(objectStore.put(data, `${id}`));

    return data;
  }

  async remove<const K extends keyof StoredIdTokenKeyMap>(
    id: IdKey,
    key: K,
  ): Promise<StoredIdTokenKeyMap[K] | null> {
    const db = await this.#connection.db$;

    const objectStore = db
      .transaction(keys[key], 'readwrite')
      .objectStore(keys[key]);

    const data =
      (await promisifyRequest<StoredIdTokenKeyMap[K] | undefined>(
        objectStore.get(`${id}`),
      )) ?? null;

    if (data !== null) {
      await promisifyRequest(objectStore.delete(`${id}`));
    }

    return data;
  }

  async clear(id: IdKey): Promise<void> {
    const db = await this.#connection.db$;

    const transaction = db.transaction(Object.values(keys), 'readwrite');

    return void (await Promise.all(
      Array.from(transaction.objectStoreNames).map((objectStoreName) =>
        promisifyRequest(
          transaction.objectStore(objectStoreName).delete(`${id}`),
        ),
      ),
    ));
  }
}
