import { inject, Injectable } from '@angular/core';
import {
  filter,
  map,
  Observable,
  pipe,
  Subject,
  switchMap,
  UnaryFunction,
} from 'rxjs';

import { deepFreeze } from '../../functions';
import { libPrefix } from '../../predefined';
import { STORAGE_VERSION } from '../../tokens';
import { KeyValuePairStorage } from '../../types';

const keyPrefix = `${libPrefix}-s` as const;

@Injectable({ providedIn: 'root' })
export class LocalStorage implements KeyValuePairStorage {
  private readonly stoageKey = (key: string) =>
    `${keyPrefix}-${this.versoin}-${key}` as const;

  private readonly versoin = inject(STORAGE_VERSION);

  // NOTE: 1) Subject is a multicast observable.
  //       2) storageEvent$ act as both Subject and Observable,
  //          cause Subject inherit Observable.
  private readonly storageEvent$ = new Subject<StorageEvent>();

  private readonly keyObservableMap = new Map<string, Observable<unknown>>();

  private readonly ready: Promise<void>;

  constructor() {
    addEventListener('storage', (storageEvent) => {
      this.storageEvent$.next(storageEvent);
    });

    this.ready = new Promise<void>((resolve) =>
      (async () => {
        Object.keys(localStorage)
          .filter((key) => key.startsWith(`${keyPrefix}-`))
          .filter((key) => !key.startsWith(this.stoageKey('')))
          .forEach((key) => localStorage.removeItem(key));

        resolve();
      })(),
    );
  }

  private readonly transformToStorage = <T>(value: T | null): string => {
    return JSON.stringify(value);
  };

  private readonly transformToValue = <T = unknown>(
    value: string | null,
  ): T | null => {
    return deepFreeze(JSON.parse(value ?? 'null'));
  };

  private readonly newTransformerPipe = <T = unknown>(
    key: string,
  ): UnaryFunction<Observable<StorageEvent>, Observable<T | null>> => {
    return pipe(
      switchMap(async (result) => {
        await this.ready;
        return result;
      }),
      filter(
        (storageEvent: StorageEvent) =>
          storageEvent.key === null || storageEvent.key === key,
      ),
      map((storageEvent: StorageEvent) => storageEvent.newValue),
      map(this.transformToValue as () => T | null),
    );
  };

  async loadItem<T = unknown>(key: string): Promise<T | null> {
    await this.ready;

    return this.transformToValue(localStorage.getItem(this.stoageKey(key)));
  }

  async storeItem<T = unknown>(key: string, value: T): Promise<T> {
    await this.ready;

    localStorage.setItem(this.stoageKey(key), this.transformToStorage(value));

    return await (this.loadItem<T>(key) as Promise<T>);
  }

  async removeItem<T = unknown>(key: string): Promise<T | null> {
    await this.ready;

    const stoageKey = this.stoageKey(key);

    const value = await this.loadItem<T>(stoageKey);
    localStorage.removeItem(stoageKey);

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
    await this.ready;

    const prefix = this.stoageKey('');
    const prefixLength = prefix.length;

    return Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefixLength));
  }
}
