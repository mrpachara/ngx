import { Injectable } from '@angular/core';
import { defer, Observable, of, switchMap, throwError } from 'rxjs';

import {
  AccessTokenExpiredError,
  AccessTokenNotFoundError,
  RefreshTokenNotFoundError,
} from '../../errors';
import {
  AccessTokenStorage,
  AccessTokenStorageFactory,
  StoredAccessToken,
} from '../../types';
import { LocalStorage } from './local.storage';

const tokenDataKeyName = `oauth-token-data`;

class AccessTokenLocalStorage implements AccessTokenStorage {
  private stoageKey = (type: 'access-token' | 'refresh-token'): string =>
    `${this.name}-${tokenDataKeyName}-${type}`;

  private readonly accessToken$: Observable<StoredAccessToken | null>;

  constructor(
    private readonly name: string,
    private readonly storage: LocalStorage,
  ) {
    this.accessToken$ = this.storage.watchItem<StoredAccessToken>(
      this.stoageKey('access-token'),
    );
  }

  loadAccessToken(): Observable<StoredAccessToken> {
    return defer(() => {
      return of(
        this.storage.loadItem<StoredAccessToken>(
          this.stoageKey('access-token'),
        ),
      ).pipe(
        switchMap((storedAccessToken) => {
          if (storedAccessToken === null) {
            return throwError(() => new AccessTokenNotFoundError());
          }

          if (storedAccessToken.expires_at < Date.now()) {
            return throwError(() => new AccessTokenExpiredError());
          }

          return of(storedAccessToken);
        }),
      );
    });
  }

  storeAccessToken(
    storedAccessToken: StoredAccessToken,
  ): Observable<StoredAccessToken> {
    return defer(() => {
      return of(
        this.storage.storeItem(
          this.stoageKey('access-token'),
          storedAccessToken,
        ),
      );
    });
  }

  removeAccessToken(): Observable<true> {
    return defer(() => {
      this.storage.removeItem(this.stoageKey('access-token'));

      return of(true as const);
    });
  }

  loadRefreshToken(): Observable<string> {
    return defer(() => {
      return of(
        this.storage.loadItem<string>(this.stoageKey('refresh-token')),
      ).pipe(
        switchMap((storedRefreshToken) => {
          if (storedRefreshToken === null) {
            return throwError(() => new RefreshTokenNotFoundError());
          }

          return of(storedRefreshToken);
        }),
      );
    });
  }

  storeRefreshToken(refreshToken: string): Observable<string> {
    return defer(() => {
      return of(
        this.storage.storeItem(this.stoageKey('refresh-token'), refreshToken),
      );
    });
  }

  clearToken(): Observable<true> {
    return defer(() => {
      this.storage.removeItem(this.stoageKey('access-token'));
      this.storage.removeItem(this.stoageKey('refresh-token'));

      return of(true as const);
    });
  }

  watchAccessToken(): Observable<StoredAccessToken | null> {
    return this.accessToken$;
  }
}

@Injectable()
export class AccessTokenLocalStorageFactory
  implements AccessTokenStorageFactory
{
  constructor(private readonly storage: LocalStorage) {}

  create(name: string): AccessTokenStorage {
    return new AccessTokenLocalStorage(name, this.storage);
  }
}
