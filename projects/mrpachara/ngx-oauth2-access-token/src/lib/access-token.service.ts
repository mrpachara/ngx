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
  AccessTokenExpiredError,
  RefreshTokenExpiredError,
  RefreshTokenNotFoundError,
} from './errors';
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
  AccessTokenResponseInfo,
  StandardGrantsParams,
  StoredAccessTokenResponse,
} from './types';
import { RefreshTokenService } from './refresh-token.service';

const latencyTime = 2 * 5 * 1000;

@Injectable({ providedIn: 'root' })
export class AccessTokenService {
  protected readonly storageFactory = inject(AccessTokenStorageFactory);
  protected readonly storage: AccessTokenStorage;
  protected readonly refreshTokenService = inject(RefreshTokenService);
  protected readonly listeners = inject(ACCESS_TOKEN_RESPONSE_LISTENERS);

  private readonly accessTokenResponse$: Observable<StoredAccessTokenResponse>;

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
        } catch (err) {
          // Prevent error.
        } finally {
          resolve();
        }
      })();
    });

    this.accessTokenResponse$ = from(ready).pipe(
      switchMap(() =>
        // NOTE: multiple tabs can request refresh_token at the same time
        //       so use race() for finding the winner.
        race(
          defer(() => this.loadStoredAccessTokenResponse()).pipe(
            catchError((accessTokenErr: unknown) => {
              return this.refreshTokenService
                .exchangeRefreshToken(this.config.name)
                .pipe(
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
          // NOTE: The access token is assigned by another tab.
          this.watchStoredAccessTokenResponse().pipe(
            filter(
              (storedTokenData): storedTokenData is StoredAccessTokenResponse =>
                storedTokenData !== null,
            ),
            filter(
              (storedTokenData) => storedTokenData.expiresAt >= Date.now(),
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

  private readonly loadStoredAccessTokenResponse = async () => {
    const storedAccessTokenResponse =
      await this.storage.loadAccessTokenResponse();

    if (storedAccessTokenResponse.expiresAt < Date.now()) {
      throw new AccessTokenExpiredError(this.config.name);
    }

    return storedAccessTokenResponse;
  };

  private readonly storeStoringAccessTokenResponse = (
    accessTokenResponse: StoredAccessTokenResponse,
  ) => this.storage.storeAccessTokenResponse(accessTokenResponse);

  private readonly removeStoredAccessTokenResponse = () =>
    this.storage.removeAccessTokenResponse();

  private readonly watchStoredAccessTokenResponse = () =>
    this.storage.watchAccessTokenResponse();

  private readonly transformAccessTokenResponse = (
    accessTokenResponse: AccessTokenResponse,
  ) => {
    const currentTime = Date.now();

    const { expires_in } = accessTokenResponse;

    const storingAccessTokenResponse: StoredAccessTokenResponse = {
      createdAt: currentTime,
      expiresAt:
        currentTime +
        (expires_in ? expires_in * 1000 : this.config.accessTokenTtl) -
        latencyTime,
      response: accessTokenResponse,
    };

    return { storingAccessTokenResponse };
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
      const errors = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === 'rejected',
        )
        .map((err) => err.reason);

      if (errors.length > 0) {
        console.log(errors);
      }
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
      const errors = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === 'rejected',
        )
        .map((err) => err.reason);

      if (errors.length > 0) {
        console.log(errors);
      }
    }

    return results;
  };

  private readonly storeStoringToken = ({
    storingAccessTokenResponse,
  }: {
    storingAccessTokenResponse: StoredAccessTokenResponse;
  }) => {
    return forkJoin([
      this.storeStoringAccessTokenResponse(storingAccessTokenResponse),
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

  fetchToken(): Observable<AccessTokenInfo> {
    return this.accessTokenResponse$.pipe(
      map(
        (storedAccessTokenResponse): AccessTokenInfo => ({
          type: storedAccessTokenResponse.response.token_type,
          token: storedAccessTokenResponse.response.access_token,
        }),
      ),
    );
  }

  fetchResponse<
    R extends AccessTokenResponse = AccessTokenResponse,
  >(): Observable<AccessTokenResponseInfo<R>> {
    return this.accessTokenResponse$ as Observable<AccessTokenResponseInfo<R>>;
  }

  extract<T extends AccessTokenResponse, R>(
    extractor: AccessTokenResponseExtractor<T, R>,
  ): Observable<R> {
    return this.fetchResponse<T>().pipe(
      extractor.extractPipe(this.config.name),
    );
  }

  ready<R>(
    process: (
      accessTokenInfo: AccessTokenInfo,
      serviceName: string,
    ) => ObservableInput<R>,
  ): Observable<R> {
    return this.fetchToken().pipe(
      switchMap((accessTokenInfo) =>
        process(accessTokenInfo, this.config.name),
      ),
    );
  }

  async setAccessTokenResponse(
    accessTokenResponse: AccessTokenResponse,
  ): Promise<AccessTokenResponse> {
    return firstValueFrom(
      of(accessTokenResponse).pipe(
        this.storeTokenPipe,
        map(() => accessTokenResponse),
      ),
    );
  }

  async removeToken(): Promise<void> {
    return await this.removeStoredAccessTokenResponse();
  }

  async clearAllTokens(): Promise<void> {
    await this.removeToken();
    await this.clearToListeners();
  }
}
