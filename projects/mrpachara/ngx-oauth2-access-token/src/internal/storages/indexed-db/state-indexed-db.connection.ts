import { APP_ID, Injectable, inject } from '@angular/core';
import { libPrefix } from '../../../lib/predefined';
import { STORAGE_VERSION_CHANGED_RELOADER } from '../../../lib/tokens';
import { stateObjectStoreName } from './state';

const version = 1;

@Injectable({
  providedIn: 'root',
})
export class StateIndexedDbConnection {
  readonly #db$: Promise<IDBDatabase>;

  get db$() {
    return this.#db$;
  }

  constructor() {
    const reloader = inject(STORAGE_VERSION_CHANGED_RELOADER);

    const dbOpenRequest = indexedDB.open(
      `${inject(APP_ID)}-${libPrefix}-state-storage`,
      version,
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
              const objectStore = db.createObjectStore(stateObjectStoreName, {
                keyPath: ['name', 'state'],
              });
              objectStore.createIndex('expires_at', ['name', 'data.expiresAt']);
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
              serviceName: 'state',
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
