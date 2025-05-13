import { AccessTokenStorage, StoredAccessTokenMap } from '../types';
import { promiseWrapper } from './helpers';

const storeName = 'accessToken';

export class IndexedDbAccessTokenStorage implements AccessTokenStorage {
  private readonly db$: Promise<IDBDatabase>;

  constructor(dbOpenRequest: IDBOpenDBRequest) {
    this.db$ = new Promise<IDBDatabase>((resolve, reject) => {
      const ac = new AbortController();

      dbOpenRequest.addEventListener(
        'upgradeneeded',
        () => {
          const db = dbOpenRequest.result;

          if (db.objectStoreNames.contains(storeName)) {
            db.deleteObjectStore(storeName);
          }

          db.createObjectStore(storeName);
        },
        { signal: ac.signal },
      );

      dbOpenRequest.addEventListener(
        'success',
        () => {
          ac.abort();

          resolve(dbOpenRequest.result);
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

  async loadData<const K extends keyof StoredAccessTokenMap>(
    key: K,
  ): Promise<StoredAccessTokenMap[K] | undefined> {
    const db = await this.db$;

    const objectStore = db
      .transaction(storeName, 'readonly')
      .objectStore(storeName);

    return await promiseWrapper<StoredAccessTokenMap[K] | undefined>(
      objectStore.get(key),
    );
  }

  async storeData<const K extends keyof StoredAccessTokenMap>(
    key: K,
    data: StoredAccessTokenMap[K],
  ): Promise<StoredAccessTokenMap[K]> {
    const db = await this.db$;

    const objectStore = db
      .transaction(storeName, 'readwrite')
      .objectStore(storeName);

    await promiseWrapper(objectStore.put(data, key));

    return data;
  }

  async removeData<const K extends keyof StoredAccessTokenMap>(
    key: K,
  ): Promise<StoredAccessTokenMap[K] | undefined> {
    const db = await this.db$;

    const objectStore = db
      .transaction(storeName, 'readwrite')
      .objectStore(storeName);

    const data = await promiseWrapper<StoredAccessTokenMap[K] | undefined>(
      objectStore.get(key),
    );

    await promiseWrapper(objectStore.delete(key));

    return data;
  }

  async clear(): Promise<void> {
    const db = await this.db$;

    const objectStore = db
      .transaction(storeName, 'readwrite')
      .objectStore(storeName);

    return void (await promiseWrapper(objectStore.clear()));
  }
}
