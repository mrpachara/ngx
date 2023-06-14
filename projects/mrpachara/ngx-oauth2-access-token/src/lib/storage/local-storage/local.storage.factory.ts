import { inject, Injectable } from '@angular/core';
import { filter, Observable, Subject, switchMap } from 'rxjs';

import { deepFreeze } from '../../functions';
import { libPrefix } from '../../predefined';
import { STORAGE_INFO } from '../../tokens';
import { KeyValuePairStorage, KeyValuePairStorageFactory } from '../../types';

class LocalStorage implements KeyValuePairStorage {
  private readonly keyObservableMap = new Map<string, Observable<unknown>>();

  get name() {
    return this.storageName;
  }

  constructor(
    private readonly storageName: string,
    private readonly storageKey: (key: string) => string,
    private readonly storagePromise: Promise<Storage>,
    private readonly storageEvent$: Observable<string | null>,
  ) {}

  private readonly transformToStorage = <T>(value: T | null): string => {
    return JSON.stringify(value);
  };

  private readonly transformToValue = <T = unknown>(
    value: string | null,
  ): T | null => {
    return deepFreeze(JSON.parse(value ?? 'null'));
  };

  async loadItem<T = unknown>(key: string): Promise<T | null> {
    const storage = await this.storagePromise;

    return this.transformToValue(storage.getItem(this.storageKey(key)));
  }

  async storeItem<T = unknown>(key: string, value: T): Promise<T> {
    const storage = await this.storagePromise;

    storage.setItem(this.storageKey(key), this.transformToStorage(value));

    return (await this.loadItem<T>(key)) as T;
  }

  async removeItem<T = unknown>(key: string): Promise<T | null> {
    const storage = await this.storagePromise;

    const storageKey = this.storageKey(key);

    const value = await this.loadItem<T>(storageKey);
    storage.removeItem(storageKey);

    return value;
  }

  watchItem<T = unknown>(key: string): Observable<T | null> {
    if (!this.keyObservableMap.has(key)) {
      this.keyObservableMap.set(
        key,
        this.storageEvent$.pipe(
          filter(
            (eventKey) =>
              eventKey === null || eventKey === this.storageKey(key),
          ),
          switchMap(async () => await this.loadItem<T>(key)),
        ),
      );
    }

    return this.keyObservableMap.get(key) as Observable<T | null>;
  }

  async keys(): Promise<string[]> {
    const storage = await this.storagePromise;

    const storagePrefix = this.storageKey('');
    const storagePrefixLenght = storagePrefix.length;

    return Object.keys(storage)
      .filter((key) => key.startsWith(storagePrefix))
      .map((key) => key.slice(storagePrefixLenght));
  }
}

const keyPrefix = `${libPrefix}-kvp` as const;

@Injectable({
  providedIn: 'root',
})
export class LocalStorageFactory implements KeyValuePairStorageFactory {
  private readonly storageInfo = inject(STORAGE_INFO);

  private readonly storageNamespace =
    `${keyPrefix}-${this.storageInfo.name}` as const;
  private readonly storagePrefix =
    `${this.storageNamespace}-${this.storageInfo.version}` as const;

  private readonly storagePromise = new Promise<Storage>((resolve) => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${this.storageNamespace}-`))
      .filter((key) => !key.startsWith(`${this.storagePrefix}-`))
      .forEach((key) => localStorage.removeItem(key));

    resolve(localStorage);
  });

  private readonly storageEvent$: Observable<string | null>;

  constructor() {
    // NOTE: Subject is a multicast observable.
    const storageEventSubject = new Subject<string | null>();
    this.storageEvent$ = storageEventSubject.asObservable();

    addEventListener('storage', (storageEvent) => {
      storageEventSubject.next(storageEvent.key);
    });
  }

  async supported(): Promise<void> {
    await this.storagePromise;
  }

  private createStorageKey(storageName: string): (key: string) => string {
    return (key: string) =>
      `${this.storagePrefix}-${storageName}-${key}` as const;
  }

  private readonly storageMap = new Map<string, KeyValuePairStorage>();

  get(storageName: string): KeyValuePairStorage {
    if (!this.storageMap.has(storageName)) {
      this.storageMap.set(
        storageName,
        new LocalStorage(
          storageName,
          this.createStorageKey(storageName),
          this.storagePromise,
          this.storageEvent$,
        ),
      );
    }

    return this.storageMap.get(storageName) as KeyValuePairStorage;
  }
}
