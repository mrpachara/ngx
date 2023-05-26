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
  UpdateToTokenResponseListenerError,
} from './errors';
import { validateAndTransformScopes } from './functions';
import { Oauth2Client } from './oauth2.client';
import { AccessTokenStorage, AccessTokenStorageFactory } from './storage';
import {
  ACCESS_TOKEN_FULL_CONFIG,
  RENEW_ACCESS_TOKEN_SOURCE,
  TOKEN_RESPONSE_LISTENERS,
} from './tokens';
import {
  AccessToken,
  AccessTokenFullConfig,
  AccessTokenInfo,
  Scopes,
  SkipReloadAccessToken,
  StandardGrantsParams,
  StoredAccessToken,
  StoredRefreshToken,
  TokenResponseExtractor,
  TokenResponseListener,
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
      ...this.listeners.map((listener) =>
        this.updateToListener(listener, storingAccessToken),
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

  private readonly updateToListener = async (
    listener: TokenResponseListener<StoredAccessToken>,
    storingAccessToken: StoredAccessToken,
  ) => {
    try {
      return await listener.onTokenResponseUpdate(
        this.config.name,
        storingAccessToken,
      );
    } catch (err) {
      return new UpdateToTokenResponseListenerError(
        listener.constructor.name,
        err,
      );
    }
  };

  private readonly accessToken$: Observable<StoredAccessToken>;

  protected readonly storageFactory = inject(AccessTokenStorageFactory);
  protected readonly storage: AccessTokenStorage;
  protected readonly listeners = inject(TOKEN_RESPONSE_LISTENERS);

  constructor(
    @Inject(ACCESS_TOKEN_FULL_CONFIG)
    protected readonly config: AccessTokenFullConfig,
    protected readonly client: Oauth2Client,
    @Optional()
    @Inject(RENEW_ACCESS_TOKEN_SOURCE)
    protected readonly renewAccessToken$: Observable<AccessToken> | null = null,
  ) {
    this.storage = this.storageFactory.create(this.config.name);

    // TODO: add storage watch for listeners.

    const ready = firstValueFrom(
      from(this.loadStoredAccessToken()).pipe(
        switchMap((storedAccessToken) =>
          forkJoin([
            ...this.listeners.map((listener) =>
              this.updateToListener(listener, storedAccessToken),
            ),
          ]),
        ),
        map(() => true),
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
      share(),
    );
  }

  fetchAccessToken(): Observable<AccessTokenInfo> {
    return this.accessToken$.pipe(
      map(
        (storedAccessToken): AccessTokenInfo => ({
          type: storedAccessToken.token_type,
          token: storedAccessToken.access_token,
        }),
      ),
    );
  }

  fetchTokenResponse<
    R extends StoredAccessToken = StoredAccessToken,
  >(): Observable<R> {
    return this.accessToken$ as Observable<R>;
  }

  extract<T extends StoredAccessToken, R>(
    extractor: TokenResponseExtractor<T, R>,
    throwError: true,
  ): Promise<NonNullable<R>>;

  extract<T extends StoredAccessToken, R>(
    extractor: TokenResponseExtractor<T, R>,
    throwError: false,
  ): Promise<R | null>;

  extract<T extends StoredAccessToken, R>(
    extractor: TokenResponseExtractor<T, R>,
  ): Promise<R | null>;

  async extract<T extends StoredAccessToken, R>(
    extractor: TokenResponseExtractor<T, R>,
    throwError = false,
  ): Promise<R | null> {
    if (typeof extractor.fetchExistedExtractedResult === 'function') {
      try {
        return await extractor.fetchExistedExtractedResult(this.config.name);
      } catch (err) {
        if (err instanceof SkipReloadAccessToken) {
          if (this.config.debug) {
            console.log(err.cause);
          }

          if (throwError) {
            throw err.cause;
          }

          return null;
        }
      }
    }

    try {
      const tokenResponse = await firstValueFrom(this.fetchTokenResponse<T>());
      return await extractor.extractTokenResponse(
        this.config.name,
        tokenResponse,
        throwError,
      );
    } catch (err) {
      if (this.config.debug) {
        console.log(err);
      }

      if (throwError) {
        throw err;
      }

      return null;
    }
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
      accessToken: AccessTokenInfo,
      serviceName: string,
    ) => ObservableInput<R>,
  ): Observable<R> {
    return this.fetchAccessToken().pipe(
      switchMap((accessToken) => process(accessToken, this.config.name)),
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
