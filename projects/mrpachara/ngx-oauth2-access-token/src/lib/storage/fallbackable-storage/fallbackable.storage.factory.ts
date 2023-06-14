import { Injectable, Injector, inject } from '@angular/core';
import { Observable, defer, switchMap } from 'rxjs';

import { FALLBACKABLE_KEY_VALUE_PAIR_STORAGE_FACTORY_TOKENS } from '../../tokens';
import {
  DeepReadonly,
  KeyValuePairStorage,
  KeyValuePairStorageFactory,
} from '../../types';

class FallbackableStorage implements KeyValuePairStorage {
  get name() {
    return this.storageName;
  }

  constructor(
    private readonly storageName: string,
    private readonly storagePromise: Promise<KeyValuePairStorage>,
  ) {}

  async loadItem<T = unknown>(key: string): Promise<DeepReadonly<T | null>> {
    return (await this.storagePromise).loadItem<T>(key);
  }

  async storeItem<T = unknown>(
    key: string,
    value: T,
  ): Promise<DeepReadonly<T>> {
    return (await this.storagePromise).storeItem<T>(key, value);
  }

  async removeItem<T = unknown>(key: string): Promise<DeepReadonly<T | null>> {
    return (await this.storagePromise).removeItem<T>(key);
  }

  watchItem<T = unknown>(key: string): Observable<DeepReadonly<T | null>> {
    return defer(async () => await this.storagePromise).pipe(
      switchMap((storage) => storage.watchItem<T>(key)),
    );
  }

  async keys(): Promise<string[]> {
    return (await this.storagePromise).keys();
  }
}

@Injectable({
  providedIn: 'root',
})
export class FallbackableStorageFactory implements KeyValuePairStorageFactory {
  private readonly injector = inject(Injector);

  private readonly storageFactoryTypes = inject(
    FALLBACKABLE_KEY_VALUE_PAIR_STORAGE_FACTORY_TOKENS,
  );

  private readonly storageFactory$ = new Promise<KeyValuePairStorageFactory>(
    (resolve, reject) => {
      (async () => {
        for (const storageFactoryType of this.storageFactoryTypes) {
          try {
            const storageFactory = this.injector.get(storageFactoryType);
            await storageFactory.supported();

            resolve(storageFactory);
            return;
          } catch (err) {
            console.warn(err);
          }
        }

        reject(new Error('Cannot find supported KeyValuePairStorageFactory'));
      })();
    },
  );

  supported(): never {
    throw new Error(
      `Cannot use ${this.constructor.name} in another ${this.constructor.name}`,
    );
  }

  private async createStoragePromise(
    storageName: string,
  ): Promise<KeyValuePairStorage> {
    const storageFactory = await this.storageFactory$;
    return storageFactory.get(storageName);
  }

  private readonly storageMap = new Map<string, KeyValuePairStorage>();

  get(storageName: string): KeyValuePairStorage {
    if (!this.storageMap.has(storageName)) {
      this.storageMap.set(
        storageName,
        new FallbackableStorage(
          storageName,
          this.createStoragePromise(storageName),
        ),
      );
    }

    return this.storageMap.get(storageName) as KeyValuePairStorage;
  }
}
