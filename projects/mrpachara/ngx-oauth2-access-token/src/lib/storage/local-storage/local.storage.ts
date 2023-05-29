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

  private readonly deepFreeze = <T = unknown>(obj: T): T => {
    const frozenObjSet = new Set<unknown>();
    const queue: unknown[] = [];

    const enqueue = (value: unknown): value is object => {
      if (
        typeof value === 'object' &&
        (value ?? null) !== null &&
        !frozenObjSet.has(value)
      ) {
        queue.push(value);

        return true;
      }

      return false;
    };

    enqueue(obj);

    while (queue.length > 0) {
      const frozenObj = Object.freeze(queue.shift());
      frozenObjSet.add(frozenObj);

      Object.keys(frozenObj).forEach((key) => {
        const nextObj = (frozenObj as { [prop: string]: unknown })[key];
        enqueue(nextObj);
      });
    }

    return obj;
  };

  private readonly transformToStorage = <T>(value: T | null): string => {
    return JSON.stringify(value);
  };

  private readonly transformToValue = <T = unknown>(
    value: string | null,
  ): T | null => {
    return this.deepFreeze(JSON.parse(value ?? 'null'));
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

    return value;
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

    return Object.keys(localStorage).filter((key) =>
      key.startsWith(`${this.stoageKey('')}`),
    );
  }
}
