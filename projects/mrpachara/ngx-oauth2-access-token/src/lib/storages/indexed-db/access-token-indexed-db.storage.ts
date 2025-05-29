import { APP_ID, inject, Injectable } from '@angular/core';
import { filter, firstValueFrom, Observable, race, Subject, timer } from 'rxjs';
import { libPrefix } from '../../predefined';
import { STORAGE_NAME } from '../../tokens';
import {
  AccessTokenStorage,
  AccessTokenStorageMessage,
  StoredAccessTokenMap,
  Uuid,
} from '../../types';
import {
  accessTokenObjectStoreName,
  lockerObjectStoreName,
  refreshTokenObjectStoreName,
} from './acces-token';
import { AccessTokenIndexedDbConnection } from './access-token-indexed-db.connection';
import { promisifyRequest } from './helpers';

/** Lock timeout in units of **miliseconds** */
const lockTimeout = 10_000;

const keys = {
  access: accessTokenObjectStoreName,
  refresh: refreshTokenObjectStoreName,
  locker: lockerObjectStoreName,
} as const;

interface Locker {
  readonly uuid: Uuid;
  timestamp: number;
}

Injectable();
export class AccessTokenIndexedDbStorage implements AccessTokenStorage {
  readonly #connection = inject(AccessTokenIndexedDbConnection);

  readonly #name = inject(STORAGE_NAME);

  readonly #uuid: Uuid = crypto.randomUUID();

  readonly #bc: BroadcastChannel;

  readonly #release$: Observable<Uuid>;

  #post(
    type: AccessTokenStorageMessage['type'],
    timestamp: number,
    to?: AccessTokenStorageMessage['to'],
  ): void {
    this.#bc.postMessage({
      type,
      timestamp: timestamp,
      from: this.#uuid,
      ...(to ? { to } : {}),
    } satisfies AccessTokenStorageMessage);
  }

  constructor() {
    const bcName =
      `${inject(APP_ID)}-${libPrefix}-access-token-storage:${this.#name}` as const;

    this.#bc = new BroadcastChannel(bcName);

    const release$$ = new Subject<Uuid>();
    this.#release$ = release$$.asObservable();

    this.#bc.addEventListener(
      'message',
      async (ev: MessageEvent<AccessTokenStorageMessage>) => {
        const message = ev.data;

        if (typeof message.to !== 'undefined' && message.to !== this.#uuid) {
          return;
        }

        switch (message.type) {
          case 'release':
            release$$.next(message.from);

            return;
          default:
            ((type: never) =>
              console.warn(
                `Broadcast '${this.#bc.name}' does not implement '${type}.'`,
              ))(message.type);
        }
      },
    );
  }

  async #waitForRelease(locker: Locker): Promise<void> {
    return void (await firstValueFrom(
      race(
        this.#release$.pipe(
          filter((releaseUuid) => releaseUuid === locker.uuid),
        ),
        timer(locker.timestamp + lockTimeout - Date.now()),
      ),
    ));
  }

  async lock(): Promise<void> {
    const db = await this.#connection.db$;

    while (true) {
      const transaction = db.transaction(keys['locker'], 'readwrite');
      const objectStore = transaction.objectStore(keys['locker']);

      // NOTE: For preventing accidentally storing `null`, check with `null` value.
      const locker =
        (await promisifyRequest<Locker | undefined>(
          objectStore.get(this.#name),
        )) ?? null;

      if (
        locker === null ||
        locker.uuid === this.#uuid ||
        Date.now() - locker.timestamp >= lockTimeout
      ) {
        return void (await promisifyRequest(
          objectStore.put(
            { uuid: this.#uuid, timestamp: Date.now() } satisfies Locker,
            this.#name,
          ),
        ));
      }

      transaction.commit();

      await this.#waitForRelease(locker);
    }
  }

  async release(): Promise<void> {
    const db = await this.#connection.db$;

    const transaction = db.transaction(keys['locker'], 'readwrite');
    const objectStore = transaction.objectStore(keys['locker']);

    const locker =
      (await promisifyRequest<Locker | undefined>(
        objectStore.get(this.#name),
      )) ?? null;

    if (locker?.uuid === this.#uuid) {
      await promisifyRequest(objectStore.delete(this.#name));

      return void this.#post('release', Date.now());
    }
  }

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
