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
import { promisifyRequest } from './helpers';

const storeName = 'accessToken';

const lockerUuidKey = 'lock-uuid';

/** `alive` interval in units of **miliseconds** */
const aliveInterval = 3_000;

/** `alive-ack` waiting time in units of **miliseconds** */
// const aliveAckWaitingTime = 100;

Injectable();
export class AccessTokenIndexedDbStorage implements AccessTokenStorage {
  readonly #uuid: Uuid = crypto.randomUUID();

  readonly #db$: Promise<IDBDatabase>;

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
    const name = inject(STORAGE_NAME);

    const fullName = `${libPrefix}-${name}-access-token-storage` as const;

    const dbOpenRequest = indexedDB.open(fullName, 1);

    this.#db$ = new Promise<IDBDatabase>((resolve, reject) => {
      const ac = new AbortController();

      dbOpenRequest.addEventListener(
        'upgradeneeded',
        (ev) => {
          const db = dbOpenRequest.result;

          // NOTE: migration prcesses
          switch (ev.oldVersion) {
            case 0:
              db.createObjectStore(storeName);
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

    this.#bc = new BroadcastChannel(fullName);

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
    const db = await this.#db$;

    let deadUuid: Uuid | null = null;

    while (true) {
      const transaction = db.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);

      // NOTE: For preventing accidentally storing `null`, check with `null` value.
      const lockerUuid =
        (await promisifyRequest<Uuid | undefined>(
          objectStore.get(lockerUuidKey),
        )) ?? null;

      // NOTE: **MUST** check `lockerUuid === null` in the **rare** case of
      // dead happend before release.
      if (lockerUuid === null || lockerUuid === deadUuid) {
        return void (await promisifyRequest(
          objectStore.put(this.#uuid, lockerUuidKey),
        ));
      }

      transaction.commit();

      deadUuid = await this.#waitForRelease(lockerUuid);
    }
  }

  async release(): Promise<void> {
    const db = await this.#db$;

    const transaction = db.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);

    const lockerUuid =
      (await promisifyRequest<Uuid | undefined>(
        objectStore.get(lockerUuidKey),
      )) ?? null;

    if (lockerUuid === this.#uuid) {
      await promisifyRequest(objectStore.delete(lockerUuidKey));

      return void this.#post('release', Date.now());
    }
  }

  async load<const K extends keyof StoredAccessTokenMap>(
    key: K,
  ): Promise<StoredAccessTokenMap[K] | undefined> {
    const db = await this.#db$;

    const objectStore = db
      .transaction(storeName, 'readonly')
      .objectStore(storeName);

    return await promisifyRequest<StoredAccessTokenMap[K] | undefined>(
      objectStore.get(key),
    );
  }

  async store<const K extends keyof StoredAccessTokenMap>(
    key: K,
    data: StoredAccessTokenMap[K],
  ): Promise<StoredAccessTokenMap[K]> {
    const db = await this.#db$;

    const objectStore = db
      .transaction(storeName, 'readwrite')
      .objectStore(storeName);

    await promisifyRequest(objectStore.put(data, key));

    return data;
  }

  async remove<const K extends keyof StoredAccessTokenMap>(
    key: K,
  ): Promise<StoredAccessTokenMap[K] | undefined> {
    const db = await this.#db$;

    const objectStore = db
      .transaction(storeName, 'readwrite')
      .objectStore(storeName);

    const data = await promisifyRequest<StoredAccessTokenMap[K] | undefined>(
      objectStore.get(key),
    );

    if (data) {
      await promisifyRequest(objectStore.delete(key));
    }

    return data;
  }

  async clear(): Promise<void> {
    const db = await this.#db$;

    const objectStore = db
      .transaction(storeName, 'readwrite')
      .objectStore(storeName);

    return void (await promisifyRequest(objectStore.clear()));
  }
}
