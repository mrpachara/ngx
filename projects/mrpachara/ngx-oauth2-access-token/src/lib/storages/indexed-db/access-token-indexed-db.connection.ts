import { APP_ID, inject, Injectable } from '@angular/core';
import { libPrefix } from '../../predefined';
import {
  accessTokenObjectStoreName,
  refreshTokenObjectStoreName,
} from './acces-token';

@Injectable({
  providedIn: 'root',
})
export class AccessTokenIndexedDbConnection {
  readonly #db$: Promise<IDBDatabase>;

  get db$() {
    return this.#db$;
  }

  constructor() {
    const dbOpenRequest = indexedDB.open(
      `${inject(APP_ID)}-${libPrefix}-access-token-storage`,
      1,
    );

    this.#db$ = new Promise<IDBDatabase>((resolve, reject) => {
      const ac = new AbortController();

      dbOpenRequest.addEventListener(
        'upgradeneeded',
        (ev) => {
          const db = dbOpenRequest.result;

          // NOTE: migration prcesses
          switch (ev.oldVersion) {
            case 0:
              db.createObjectStore(accessTokenObjectStoreName);
              db.createObjectStore(refreshTokenObjectStoreName);
          }
        },
        { signal: ac.signal },
      );

      dbOpenRequest.addEventListener(
        'success',
        () => {
          ac.abort();

          const db = dbOpenRequest.result;

          // TODO: notify needed reload
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
}
