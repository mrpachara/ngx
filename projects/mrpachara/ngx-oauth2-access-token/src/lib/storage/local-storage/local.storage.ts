import { inject, Injectable } from '@angular/core';
import { filter, map, Observable, pipe, Subject } from 'rxjs';

import { deepFreeze } from '../../functions';
import { libPrefix } from '../../predefined';
import { STORAGE_VERSION } from '../../tokens';
import { KeyValuePairStorage, KeyValuePairStorageFactory } from '../../types';

export class LocalStorage implements KeyValuePairStorage {
  private readonly stoageKey = (key: string) =>
    `${this.storagePrefix}-${this.storageName}-${key}` as const;

  // NOTE: 1) Subject is a multicast observable.
  //       2) storageEvent$ act as both Subject and Observable,
  //          cause Subject inherit Observable.
  private readonly storageEvent$ = new Subject<StorageEvent>();

  private readonly keyObservableMap = new Map<string, Observable<unknown>>();

  get name() {
    return this.storageName;
  }

  constructor(
    private readonly storagePromise: Promise<Storage>,
    private readonly storagePrefix: string,
    private readonly storageName: string,
  ) {
    addEventListener('storage', (storageEvent) => {
      this.storageEvent$.next(storageEvent);
    });
  }

  private readonly transformToStorage = <T>(value: T | null): string => {
    return JSON.stringify(value);
  };

  private readonly transformToValue = <T = unknown>(
    value: string | null,
  ): T | null => {
    return deepFreeze(JSON.parse(value ?? 'null'));
  };

  private readonly newTransformerPipe = <T = unknown>(key: string) => {
    return pipe(
      filter(
        (storageEvent: StorageEvent) =>
          storageEvent.key === null || storageEvent.key === key,
      ),
      map((storageEvent: StorageEvent) => storageEvent.newValue),
      map(this.transformToValue as () => T | null),
    );
  };

  async loadItem<T = unknown>(key: string): Promise<T | null> {
    const storage = await this.storagePromise;

    return this.transformToValue(storage.getItem(this.stoageKey(key)));
  }

  async storeItem<T = unknown>(key: string, value: T): Promise<T> {
    const storage = await this.storagePromise;

    storage.setItem(this.stoageKey(key), this.transformToStorage(value));

    return await (this.loadItem<T>(key) as Promise<T>);
  }

  async removeItem<T = unknown>(key: string): Promise<T | null> {
    const storage = await this.storagePromise;

    const stoageKey = this.stoageKey(key);

    const value = await this.loadItem<T>(stoageKey);
    storage.removeItem(stoageKey);

    return value;
  }

  watchItem<T = unknown>(key: string): Observable<T | null> {
    if (!this.keyObservableMap.has(key)) {
      this.keyObservableMap.set(
        key,
        this.storageEvent$.pipe(
          this.newTransformerPipe<T>(this.stoageKey(key)),
        ),
      );
    }

    const observable = this.keyObservableMap.get(key) as Observable<T>;

    if (typeof observable !== 'undefined') {
      return observable;
    }

    throw new Error(`Cannot find or create observable for '${key}'!`);
  }

  async keys(): Promise<string[]> {
    const storage = await this.storagePromise;

    const prefix = this.stoageKey('');
    const prefixLength = prefix.length;

    return Object.keys(storage)
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefixLength));
  }
}

const keyPrefix = `${libPrefix}-s` as const;

@Injectable({ providedIn: 'root' })
export class LocalStorageFactory implements KeyValuePairStorageFactory {
  private readonly versoin = inject(STORAGE_VERSION);
  private readonly storagePrefix = `${keyPrefix}-${this.versoin}` as const;

  private readonly storagePromise = new Promise<Storage>((resolve) => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${keyPrefix}-`))
      .filter((key) => !key.startsWith(`${this.storagePrefix}-`))
      .forEach((key) => localStorage.removeItem(key));

    resolve(localStorage);
  });

  create(storageName: string): KeyValuePairStorage {
    return new LocalStorage(
      this.storagePromise,
      this.storagePrefix,
      storageName,
    );
  }
}
