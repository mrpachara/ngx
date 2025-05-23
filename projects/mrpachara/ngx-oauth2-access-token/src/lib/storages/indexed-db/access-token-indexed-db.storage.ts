import { inject, Injectable } from '@angular/core';
import {
  defer,
  firstValueFrom,
  map,
  Observable,
  race,
  skipWhile,
  Subject,
  tap,
  timer,
} from 'rxjs';
import { libPrefix } from '../../predefined';
import { STORAGE_NAME } from '../../tokens';
import {
  AccessTokenStorage,
  StorageMessage,
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

/** `alive` interval in units of **miliseconds** */
const aliveInterval = 3_000;

const keys = {
  access: accessTokenObjectStoreName,
  refresh: refreshTokenObjectStoreName,
  locker: lockerObjectStoreName,
} as const;

Injectable();
export class AccessTokenIndexedDbStorage implements AccessTokenStorage {
  readonly #connection = inject(AccessTokenIndexedDbConnection);

  readonly #name = inject(STORAGE_NAME);

  readonly #uuid: Uuid = crypto.randomUUID();

  readonly #bc: BroadcastChannel;

  readonly #aliveAck$: Observable<Uuid>;
  readonly #release$: Observable<Uuid>;

  #post(
    type: StorageMessage['type'],
    timestamp: number,
    to?: StorageMessage['to'],
  ): void {
    this.#bc.postMessage({
      type,
      timestamp: timestamp,
      from: this.#uuid,
      ...(to ? { to } : {}),
    } satisfies StorageMessage);
  }

  constructor() {
    const bcName = `${libPrefix}-access-token-storage:${this.#name}` as const;

    this.#bc = new BroadcastChannel(bcName);

    const aliveAck$$ = new Subject<Uuid>();
    this.#aliveAck$ = aliveAck$$.asObservable();

    const release$$ = new Subject<Uuid>();
    this.#release$ = release$$.asObservable();

    this.#bc.addEventListener(
      'message',
      async (ev: MessageEvent<StorageMessage>) => {
        const message = ev.data;

        if (typeof message.to !== 'undefined' && message.to !== this.#uuid) {
          return;
        }

        switch (message.type) {
          case 'alive':
            this.#post('alive-ack', Date.now());

            return;
          case 'alive-ack':
            aliveAck$$.next(message.from);

            return;
          case 'release':
            release$$.next(message.from);

            return;
          default:
            ((message: never) =>
              console.warn(
                `Broadcast '${this.#bc.name}' does not implement '${(message as { type: string }).type}.'`,
              ))(message);
        }
      },
    );
  }

  async #waitForRelease(lockerUuid: Uuid): Promise<Uuid | null> {
    let deadUuid: Uuid | null = lockerUuid;

    return await firstValueFrom(
      race(
        this.#release$.pipe(map(() => null)),
        timer(aliveInterval).pipe(map(() => deadUuid)),
        defer(() => {
          this.#post('alive', Date.now(), lockerUuid);

          return this.#aliveAck$.pipe(
            tap(() => (deadUuid = null)),
            skipWhile(() => true),
          );
        }),
      ),
    );
  }

  async lock(): Promise<void> {
    const db = await this.#connection.db$;

    let deadUuid: Uuid | null = null;

    while (true) {
      const transaction = db.transaction(keys['locker'], 'readwrite');
      const objectStore = transaction.objectStore(keys['locker']);

      // NOTE: For preventing accidentally storing `null`, check with `null` value.
      const lockerUuid =
        (await promisifyRequest<Uuid | undefined>(
          objectStore.get(this.#name),
        )) ?? null;

      // NOTE: **MUST** check `lockerUuid === null` in the **rare** case of
      // dead happend before release.
      if (
        lockerUuid === null ||
        lockerUuid === this.#uuid ||
        lockerUuid === deadUuid
      ) {
        return void (await promisifyRequest(
          objectStore.put(this.#uuid, this.#name),
        ));
      }

      transaction.commit();

      deadUuid = await this.#waitForRelease(lockerUuid);
    }
  }

  async release(): Promise<void> {
    const db = await this.#connection.db$;

    const transaction = db.transaction(keys['locker'], 'readwrite');
    const objectStore = transaction.objectStore(keys['locker']);

    const lockerUuid =
      (await promisifyRequest<Uuid | undefined>(objectStore.get(this.#name))) ??
      null;

    if (lockerUuid === this.#uuid) {
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
