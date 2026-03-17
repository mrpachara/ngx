import { APP_ID, inject, Injectable } from '@angular/core';
import {
  libPrefix,
  STORAGE_VERSION_CHANGED_RELOADER,
} from '@mrpachara/ngx-oauth2-access-token';
import {
  idTokenClaimsObjectStoreName,
  idTokenInfoObjectStoreName,
} from './id-tokents';

@Injectable({
  providedIn: 'root',
})
export class IdTokenIndexedDbConnection {
  readonly #db$: Promise<IDBDatabase>;

  get db$() {
    return this.#db$;
  }

  constructor() {
    const reloader = inject(STORAGE_VERSION_CHANGED_RELOADER);

    const dbOpenRequest = indexedDB.open(
      `${inject(APP_ID)}-${libPrefix}-id-token-storage`,
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
            case 0: {
              db.createObjectStore(idTokenInfoObjectStoreName);
              db.createObjectStore(idTokenClaimsObjectStoreName);
            }
          }
        },
        { signal: ac.signal },
      );

      dbOpenRequest.addEventListener(
        'success',
        () => {
          ac.abort();

          const db = dbOpenRequest.result;

          db.addEventListener('versionchange', async (ev) => {
            db.close();
            await reloader({
              serviceName: 'id-token',
              oldVersion: ev.oldVersion,
              newVersion: ev.newVersion,
            });
          });

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
