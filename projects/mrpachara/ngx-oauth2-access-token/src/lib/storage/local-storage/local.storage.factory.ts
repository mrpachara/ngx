import { inject, Injectable } from '@angular/core';
import { filter, map, Observable, pipe, Subject } from 'rxjs';

import { deepFreeze } from '../../functions';
import { libPrefix } from '../../predefined';
import { STORAGE_INFO } from '../../tokens';
import { KeyValuePairStorage, KeyValuePairStorageFactory } from '../../types';

class LocalStorage implements KeyValuePairStorage {
  private readonly storageKey = (key: string) =>
    `${this.storagePrefix}-${this.storageName}-${key}` as const;

  private readonly keyObservableMap = new Map<string, Observable<unknown>>();

  get name() {
    return this.storageName;
  }

  constructor(
    private readonly storageName: string,
    private readonly storagePromise: Promise<Storage>,
    private readonly storagePrefix: string,
    private readonly storageEvent$: Observable<StorageEvent>,
  ) {}

  private readonly transformToStorage = <T>(value: T | null): string => {
    return JSON.stringify(value);
  };

  private readonly transformToValue = <T = unknown>(
    value: string | null,
  ): T | null => {
    return deepFreeze(JSON.parse(value ?? 'null'));
  };

  // TODO: move fillter logic to factory
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
          // NOTE: StorageEvent passes the full key name and value.
          //       So change key to full key name.
          this.newTransformerPipe<T>(this.storageKey(key)),
        ),
      );
    }

    return this.keyObservableMap.get(key) as Observable<T>;
  }

  async keys(): Promise<string[]> {
    const storage = await this.storagePromise;

    const prefix = this.storageKey('');
    const prefixLength = prefix.length;

    // TODO: move fillter logic to factory
    return Object.keys(storage)
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefixLength));
  }
}

const keyPrefix = `${libPrefix}-kvp` as const;

@Injectable({
  providedIn: 'root',
})
export class LocalStorageFactory implements KeyValuePairStorageFactory {
  private readonly storageInfo = inject(STORAGE_INFO);

  private readonly storageNamespace = `${keyPrefix}-${this.storageInfo.name}`;
  private readonly storagePrefix =
    `${this.storageNamespace}-${this.storageInfo.version}` as const;

  private readonly storagePromise = new Promise<Storage>((resolve) => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${this.storageNamespace}-`))
      .filter((key) => !key.startsWith(`${this.storagePrefix}-`))
      .forEach((key) => localStorage.removeItem(key));

    resolve(localStorage);
  });

  private readonly storageEvent$: Observable<StorageEvent>;

  constructor() {
    // NOTE: Subject is a multicast observable.
    const storageEventSubject = new Subject<StorageEvent>();
    this.storageEvent$ = storageEventSubject.asObservable();

    addEventListener('storage', (storageEvent) => {
      storageEventSubject.next(storageEvent);
    });
  }

  create(storageName: string): KeyValuePairStorage {
    return new LocalStorage(
      storageName,
      this.storagePromise,
      this.storagePrefix,
      this.storageEvent$,
    );
  }
}
