import { Inject, Injectable, Optional, inject } from '@angular/core';
import {
  catchError,
  defer,
  filter,
  firstValueFrom,
  forkJoin,
  from,
  map,
  Observable,
  ObservableInput,
  of,
  pipe,
  race,
  share,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';

import {
  InvalidScopeError,
  RefreshTokenExpiredError,
  RefreshTokenNotFoundError,
} from './errors';
import { validateAndTransformScopes } from './functions';
import { Oauth2Client } from './oauth2.client';
import { AccessTokenStorage, AccessTokenStorageFactory } from './storage';
import {
  ACCESS_TOKEN_EXTRACTOR,
  ACCESS_TOKEN_FULL_CONFIG,
  RENEW_ACCESS_TOKEN_SOURCE,
} from './tokens';
import {
  AccessToken,
  AccessTokenFullConfig,
  AccessTokenInfo,
  Scopes,
  StandardGrantsParams,
  StoredAccessToken,
  StoredRefreshToken,
} from './types';

const latencyTime = 2 * 5 * 1000;

@Injectable({ providedIn: 'root' })
export class AccessTokenService {
  private readonly loadStoredAccessToken = () => this.storage.loadAccessToken();

  private readonly loadRefreshToken = () => this.storage.loadRefreshToken();

  private readonly storeStoringAccessToken = (accessToken: StoredAccessToken) =>
    this.storage.storeAccessToken(accessToken);

  private readonly storeRefreshToken = (refreshToken: StoredRefreshToken) =>
    this.storage.storeRefreshToken(refreshToken);

  private readonly transformToken = (accessToken: AccessToken) => {
    const currentTime = Date.now();

    const { expires_in, refresh_token, ...extractedAccessToken } = accessToken;

    const storingAccessToken: StoredAccessToken = {
      ...extractedAccessToken,
      expires_at:
        currentTime +
        (expires_in ? expires_in * 1000 : this.config.accessTokenTtl) -
        latencyTime,
    };

    const storingRefreshToken: StoredRefreshToken | undefined = refresh_token
      ? {
          refresh_token: refresh_token,
          expires_at: currentTime + this.config.refreshTokenTtl - latencyTime,
        }
      : undefined;

    return { storingAccessToken, storingRefreshToken };
  };

  private readonly storeStoringToken = ({
    storingAccessToken,
    storingRefreshToken,
  }: {
    storingAccessToken: StoredAccessToken;
    storingRefreshToken: StoredRefreshToken | undefined;
  }) => {
    return forkJoin([
      this.storeStoringAccessToken(storingAccessToken),
      ...(storingRefreshToken
        ? [this.storeRefreshToken(storingRefreshToken)]
        : []),
      ...this.extractors.map((extractor) =>
        extractor.extractToken(this.config.name, storingAccessToken),
      ),
    ]);
  };

  private readonly storeTokenPipe = pipe(
    map(this.transformToken),
    switchMap(this.storeStoringToken),
    map(([storedAccessToken]) => storedAccessToken),
  );

  private readonly requestAccessToken = (
    params: StandardGrantsParams,
  ): Observable<AccessToken> => {
    return this.client.requestAccessToken({
      ...this.config.additionalParams,
      ...params,
    });
  };

  private readonly accessToken$: Observable<AccessTokenInfo>;

  protected readonly storageFactory = inject(AccessTokenStorageFactory);
  protected readonly storage: AccessTokenStorage;
  protected readonly extractors = inject(ACCESS_TOKEN_EXTRACTOR);

  constructor(
    @Inject(ACCESS_TOKEN_FULL_CONFIG)
    protected readonly config: AccessTokenFullConfig,
    protected readonly client: Oauth2Client,
    @Optional()
    @Inject(RENEW_ACCESS_TOKEN_SOURCE)
    protected readonly renewAccessToken$: Observable<AccessToken> | null = null,
  ) {
    this.storage = this.storageFactory.create(this.config.name);

    const ready = firstValueFrom(
      from(this.loadStoredAccessToken()).pipe(
        switchMap((storedAcccessToken) =>
          forkJoin([
            ...this.extractors.map((extractor) =>
              extractor.extractToken(this.config.name, storedAcccessToken),
            ),
          ]).pipe(map(() => true)),
        ),
        catchError(() => of(true)),
      ),
    );

    this.accessToken$ = from(ready).pipe(
      switchMap(() =>
        // NOTE: multiple tabs can request refresh_token at the same time
        //       so use race() for finding the winner.
        race(
          defer(() => this.loadStoredAccessToken()).pipe(
            catchError((accessTokenErr: unknown) => {
              return this.exchangeRefreshToken().pipe(
                this.storeTokenPipe,
                catchError((refreshTokenErr: unknown) => {
                  if (
                    refreshTokenErr instanceof RefreshTokenNotFoundError ||
                    refreshTokenErr instanceof RefreshTokenExpiredError
                  ) {
                    return throwError(() => accessTokenErr);
                  }

                  return throwError(() => refreshTokenErr);
                }),
              );
            }),
            catchError((err) => {
              if (this.renewAccessToken$) {
                if (this.config.debug) console.log(err);
                return this.renewAccessToken$.pipe(this.storeTokenPipe);
              } else {
                return throwError(() => err);
              }
            }),
            tap(() => {
              if (this.config.debug) {
                console.debug('access-token-race:', 'I am a winner!!!');
              }
            }),
          ),
          // NOTE: Access token is assigned by another tab.
          this.storage.watchAccessToken().pipe(
            filter(
              (storedTokenData): storedTokenData is StoredAccessToken =>
                storedTokenData !== null,
            ),
            filter(
              (storedTokenData) => storedTokenData.expires_at >= Date.now(),
            ),
            take(1),
            tap(() => {
              if (this.config.debug) {
                console.debug('access-token-race:', 'I am a loser!!!');
              }
            }),
          ),
        ),
      ),
      map(
        (storedAccessToken): AccessTokenInfo => ({
          type: storedAccessToken.token_type,
          token: storedAccessToken.access_token,
        }),
      ),
      share(),
    );
  }

  fetchAccessToken(): Observable<AccessTokenInfo> {
    return this.accessToken$;
  }

  exchangeRefreshToken(scopes?: Scopes): Observable<AccessToken> {
    return defer(() => this.loadRefreshToken()).pipe(
      switchMap((storedRefreshToken) => {
        const scope = scopes ? validateAndTransformScopes(scopes) : null;

        if (scope instanceof InvalidScopeError) {
          return throwError(() => scope);
        }

        return this.requestAccessToken({
          grant_type: 'refresh_token',
          refresh_token: storedRefreshToken.refresh_token,
          ...(scope ? { scope } : {}),
        });
      }),
    );
  }

  ready<R>(
    process: (
      serviceName: string,
      accessToken: AccessTokenInfo,
    ) => ObservableInput<R>,
  ): Observable<R> {
    return this.fetchAccessToken().pipe(
      switchMap((accessToken) => process(this.config.name, accessToken)),
    );
  }

  async setAccessToken(accessToken: AccessToken): Promise<AccessToken> {
    return firstValueFrom(
      of(accessToken).pipe(
        this.storeTokenPipe,
        map(() => accessToken),
      ),
    );
  }

  async removeAccessToken(): Promise<void> {
    return await this.storage.removeAccessToken();
  }

  async clearToken(): Promise<void> {
    return await this.storage.clearToken();
  }
}
