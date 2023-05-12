import { Injectable } from '@angular/core';
import { filter, map, Observable, pipe, Subject, UnaryFunction } from 'rxjs';
import { KeyValuePairStorage } from '../../types';

@Injectable({ providedIn: 'root' })
export class LocalStorage implements KeyValuePairStorage {
  private readonly transToStorage = <T>(value: T | null): string => {
    return JSON.stringify(value);
  };

  private readonly transToValue = <T = unknown>(
    value: string | null,
  ): T | null => {
    return Object.freeze(JSON.parse(value ?? 'null'));
  };

  private readonly newTransformerPipe = <T = unknown>(
    key: string,
  ): UnaryFunction<Observable<StorageEvent>, Observable<T | null>> => {
    return pipe(
      filter(
        (storageEvent: StorageEvent) =>
          storageEvent.key === null || storageEvent.key === key,
      ),
      map((storageEvent: StorageEvent) => storageEvent.newValue),
      map(this.transToValue as () => T | null),
    );
  };

  // NOTE: 1) Subject is a multicast observable.
  //       2) storageEvent$ act as both Subject and Observable,
  //       cause Subject inherit Observable.
  private readonly storageEvent$ = new Subject<StorageEvent>();

  private readonly keyObservableMap = new Map<string, Observable<unknown>>();

  constructor() {
    addEventListener('storage', (storageEvent) => {
      this.storageEvent$.next(storageEvent);
    });
  }

  async loadItem<T = unknown>(key: string): Promise<T | null> {
    return this.transToValue(localStorage.getItem(key));
  }

  async storeItem<T = unknown>(key: string, value: T): Promise<T> {
    localStorage.setItem(key, this.transToStorage(value));

    return value;
  }

  async removeItem<T = unknown>(key: string): Promise<T | null> {
    const value = await this.loadItem<T>(key);
    localStorage.removeItem(key);

    return value;
  }

  watchItem<T = unknown>(key: string): Observable<T | null> {
    if (!this.keyObservableMap.has(key)) {
      this.keyObservableMap.set(
        key,
        this.storageEvent$.pipe(this.newTransformerPipe<T>(key)),
      );
    }

    const observable = this.keyObservableMap.get(key) as Observable<T>;

    if (typeof observable !== 'undefined') {
      return observable;
    }

    throw new Error(`Cannot find or create observable for '${key}'!`);
  }

  async keys(): Promise<string[]> {
    return Object.keys(localStorage);
  }
}
