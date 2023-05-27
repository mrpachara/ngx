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
  ACCESS_TOKEN_FULL_CONFIG,
  ACCESS_TOKEN_RESPONSE_LISTENERS,
  RENEW_ACCESS_TOKEN_SOURCE,
} from './tokens';
import {
  AccessTokenFullConfig,
  AccessTokenInfo,
  AccessTokenResponse,
  AccessTokenResponseExtractor,
  Scopes,
  SkipReloadAccessToken,
  StandardGrantsParams,
  StoredAccessTokenResponse,
  StoredRefreshToken,
} from './types';

const latencyTime = 2 * 5 * 1000;

@Injectable({ providedIn: 'root' })
export class AccessTokenService {
  protected readonly storageFactory = inject(AccessTokenStorageFactory);
  protected readonly storage: AccessTokenStorage;
  protected readonly listeners = inject(ACCESS_TOKEN_RESPONSE_LISTENERS);

  private readonly accessToken$: Observable<StoredAccessTokenResponse>;

  constructor(
    @Inject(ACCESS_TOKEN_FULL_CONFIG)
    protected readonly config: AccessTokenFullConfig,
    protected readonly client: Oauth2Client,
    @Optional()
    @Inject(RENEW_ACCESS_TOKEN_SOURCE)
    protected readonly renewAccessToken$: Observable<AccessTokenResponse> | null = null,
  ) {
    this.storage = this.storageFactory.create(this.config.name);

    const ready = new Promise<void>((resolve) => {
      (async () => {
        try {
          const storedAccessTokenResponse =
            await this.loadStoredAccessTokenResponse();
          await this.updateToListeners(storedAccessTokenResponse);
        } finally {
          resolve();
        }
      })();
    });

    this.accessToken$ = from(ready).pipe(
      switchMap(() =>
        // NOTE: multiple tabs can request refresh_token at the same time
        //       so use race() for finding the winner.
        race(
          defer(() => this.loadStoredAccessTokenResponse()).pipe(
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
          this.storage.watchAccessTokenResponse().pipe(
            filter(
              (storedTokenData): storedTokenData is StoredAccessTokenResponse =>
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

  private readonly loadStoredAccessTokenResponse = () =>
    this.storage.loadAccessTokenResponse();

  private readonly storeStoringAccessTokenResponse = (
    accessTokenResponse: StoredAccessTokenResponse,
  ) => this.storage.storeAccessTokenResponse(accessTokenResponse);

  private readonly removeStoredAccessTokenResponse = () =>
    this.storage.removeAccessTokenResponse();

  private readonly loadRefreshToken = () => this.storage.loadRefreshToken();

  private readonly storeRefreshToken = (refreshToken: StoredRefreshToken) =>
    this.storage.storeRefreshToken(refreshToken);

  private readonly transformAccessTokenResponse = (
    accessTokenResponse: AccessTokenResponse,
  ) => {
    const currentTime = Date.now();

    const { expires_in, refresh_token, ...extractedAccessTokenResponse } =
      accessTokenResponse;

    const storingAccessTokenResponse: StoredAccessTokenResponse = {
      ...extractedAccessTokenResponse,
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

    return { storingAccessTokenResponse, storingRefreshToken };
  };

  private readonly updateToListeners = async (
    storingAccessTokenResponse: StoredAccessTokenResponse,
  ) => {
    const results = await Promise.allSettled(
      this.listeners.map((listener) =>
        listener.onAccessTokenResponseUpdate(
          this.config.name,
          storingAccessTokenResponse,
        ),
      ),
    );

    if (this.config.debug) {
      console.log(
        results
          .filter(
            (result): result is PromiseRejectedResult =>
              result.status === 'rejected',
          )
          .map((err) => err.reason),
      );
    }

    return results;
  };

  private readonly clearToListeners = async () => {
    const results = await Promise.allSettled(
      this.listeners.map((listener) =>
        listener.onAccessTokenResponseClear(this.config.name),
      ),
    );

    if (this.config.debug) {
      console.log(
        results
          .filter(
            (result): result is PromiseRejectedResult =>
              result.status === 'rejected',
          )
          .map((err) => err.reason),
      );
    }

    return results;
  };

  private readonly storeStoringToken = ({
    storingAccessTokenResponse,
    storingRefreshToken,
  }: {
    storingAccessTokenResponse: StoredAccessTokenResponse;
    storingRefreshToken: StoredRefreshToken | undefined;
  }) => {
    return forkJoin([
      this.storeStoringAccessTokenResponse(storingAccessTokenResponse),
      ...(storingRefreshToken
        ? [this.storeRefreshToken(storingRefreshToken)]
        : []),
      this.updateToListeners(storingAccessTokenResponse),
    ]);
  };

  private readonly storeTokenPipe = pipe(
    map(this.transformAccessTokenResponse),
    switchMap(this.storeStoringToken),
    map(([storedAccessTokenResponse]) => storedAccessTokenResponse),
  );

  private readonly requestAccessToken = (
    params: StandardGrantsParams,
  ): Observable<AccessTokenResponse> => {
    return this.client.requestAccessToken({
      ...this.config.additionalParams,
      ...params,
    });
  };

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
    R extends StoredAccessTokenResponse = StoredAccessTokenResponse,
  >(): Observable<R> {
    return this.accessToken$ as Observable<R>;
  }

  extract<T extends StoredAccessTokenResponse, R>(
    extractor: AccessTokenResponseExtractor<T, R>,
    throwError: true,
  ): Promise<NonNullable<R>>;

  extract<T extends StoredAccessTokenResponse, R>(
    extractor: AccessTokenResponseExtractor<T, R>,
    throwError: false,
  ): Promise<R | null>;

  extract<T extends StoredAccessTokenResponse, R>(
    extractor: AccessTokenResponseExtractor<T, R>,
  ): Promise<R | null>;

  async extract<T extends StoredAccessTokenResponse, R>(
    extractor: AccessTokenResponseExtractor<T, R>,
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
      return await extractor.extractAccessTokenResponse(
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

  exchangeRefreshToken(scopes?: Scopes): Observable<AccessTokenResponse> {
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

  async setAccessToken(
    accessTokenResponse: AccessTokenResponse,
  ): Promise<AccessTokenResponse> {
    return firstValueFrom(
      of(accessTokenResponse).pipe(
        this.storeTokenPipe,
        map(() => accessTokenResponse),
      ),
    );
  }

  async removeAccessTokenResponse(): Promise<void> {
    return await this.removeStoredAccessTokenResponse();
  }

  async clearToken(): Promise<void> {
    await this.storage.clearToken();
    await this.clearToListeners();
  }
}
