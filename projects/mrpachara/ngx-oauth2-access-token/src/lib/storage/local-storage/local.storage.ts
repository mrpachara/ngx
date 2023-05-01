import { Injectable } from '@angular/core';
import { filter, map, Observable, pipe, Subject, UnaryFunction } from 'rxjs';

@Injectable()
export class LocalStorage {
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

  loadItem<T = unknown>(key: string): T | null {
    return this.transToValue(localStorage.getItem(key));
  }

  storeItem<T = unknown>(key: string, value: T): T {
    localStorage.setItem(key, this.transToStorage(value));

    return value;
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  watchItem<T = unknown>(key: string): Observable<T | null> {
    if (!this.keyObservableMap.has(key)) {
      this.keyObservableMap.set(
        key,
        this.storageEvent$.pipe(this.newTransformerPipe(key)),
      );
    }

    const observable = this.keyObservableMap.get(key) as Observable<T>;

    if (typeof observable !== 'undefined') {
      return observable;
    }

    throw new Error(`Cannot find or create observable for '${key}'!`);
  }

  keys(): string[] {
    return Object.keys(localStorage);
  }
}
