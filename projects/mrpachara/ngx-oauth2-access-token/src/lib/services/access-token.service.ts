import { inject, isDevMode } from '@angular/core';
import {
  catchError,
  concat,
  defer,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  from,
  map,
  merge,
  Observable,
  of,
  pipe,
  race,
  share,
  Subject,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';

import { Oauth2Client } from './oauth2.client';
import { RefreshTokenService } from './refresh-token.service';

import {
  AccessTokenExpiredError,
  NonRegisteredExtractorError,
  RefreshTokenExpiredError,
  RefreshTokenNotFoundError,
} from '../errors';
import { AccessTokenStorage, AccessTokenStorageFactory } from '../storage';
import {
  AccessTokenFullConfig,
  AccessTokenInfo,
  AccessTokenResponse,
  AccessTokenResponseExtractor,
  AccessTokenResponseExtractorInfo,
  AccessTokenResponseInfo,
  AccessTokenServiceInfo,
  AccessTokenServiceInfoProvidable,
  Provided,
  StandardGrantsParams,
  StoredAccessTokenResponse,
} from '../types';
import {
  ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS,
  DEFAULT_ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS,
} from '../tokens';
import { HttpErrorResponse } from '@angular/common/http';

const latencyTime = 2 * 5 * 1000;

export class AccessTokenService implements AccessTokenServiceInfoProvidable {
  private readonly storageFactory = inject(AccessTokenStorageFactory);
  private readonly storage: AccessTokenStorage;
  private readonly refreshTokenService = inject(RefreshTokenService);

  private readonly defaultExtractors = inject(
    DEFAULT_ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS,
  );
  private readonly scopedExtractors = inject(
    ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS,
    {
      self: true,
      optional: true,
    },
  );
  private readonly parentExtractors = inject(
    ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS,
    {
      skipSelf: true,
      optional: true,
    },
  );

  private readonly extractorMap: Map<AccessTokenResponseExtractor, unknown>;
  private readonly listeners: AccessTokenResponseExtractor[];

  private readonly accessTokenResponse$: Observable<StoredAccessTokenResponse>;

  private readonly subjectStoredAccessTokenResponse$ =
    new Subject<StoredAccessTokenResponse>();

  private readonly storedAccessTokenResponse$: Observable<StoredAccessTokenResponse>;

  get name() {
    return this.config.name;
  }

  constructor(
    private readonly config: AccessTokenFullConfig,
    private readonly client: Oauth2Client,
    private readonly individualExtractors: AccessTokenResponseExtractorInfo[],
    private readonly renewAccessToken$: Observable<AccessTokenResponse> | null = null,
  ) {
    this.extractorMap = new Map([
      ...this.defaultExtractors,
      ...(this.parentExtractors ?? []),
      ...(this.scopedExtractors ?? []),
      ...this.individualExtractors,
    ]);

    this.listeners = [...this.extractorMap.keys()];

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
              return this.refreshTokenService.exchangeRefreshToken(this).pipe(
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
                if (isDevMode() && !(err instanceof HttpErrorResponse)) {
                  console.log(err);
                }

                if (err instanceof HttpErrorResponse) {
                  console.warn(err);
                }

                return this.renewAccessToken$.pipe(this.storeTokenPipe);
              } else {
                return throwError(() => err);
              }
            }),
            tap(() => {
              if (isDevMode()) {
                console.log('access-token-race:', 'I am a winner!!!');
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
              if (isDevMode()) {
                console.log('access-token-race:', 'I am a loser!!!');
              }
            }),
          ),
        ),
      ),
      share(),
    );

    this.storedAccessTokenResponse$ = merge(
      this.subjectStoredAccessTokenResponse$,
      this.watchStoredAccessTokenResponse().pipe(
        filter(
          (
            storedAccessTokenResponse,
          ): storedAccessTokenResponse is StoredAccessTokenResponse =>
            storedAccessTokenResponse !== null,
        ),
      ),
    ).pipe(distinctUntilChanged());
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

    return storingAccessTokenResponse;
  };

  private readonly updateToListeners = async (
    storingAccessTokenResponse: StoredAccessTokenResponse,
  ) => {
    const results = await Promise.allSettled(
      this.listeners
        .filter(
          (
            listener,
          ): listener is Provided<
            typeof listener,
            'onAccessTokenResponseUpdate'
          > => typeof listener.onAccessTokenResponseUpdate === 'function',
        )
        .map((listener) =>
          listener.onAccessTokenResponseUpdate(
            this.serviceInfo(listener),
            storingAccessTokenResponse,
          ),
        ),
    );

    if (isDevMode()) {
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
      this.listeners
        .filter(
          (
            listener,
          ): listener is Provided<
            typeof listener,
            'onAccessTokenResponseClear'
          > => typeof listener.onAccessTokenResponseClear === 'function',
        )
        .map((listener) =>
          listener.onAccessTokenResponseClear(this.serviceInfo(listener)),
        ),
    );

    if (isDevMode()) {
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

  private readonly storeStoringToken = async (
    storingAccessTokenResponse: StoredAccessTokenResponse,
  ) => {
    await this.updateToListeners(storingAccessTokenResponse);

    // NOTE: Storing AccessTokenResponse must be called after updateToListeners()
    //       unless localStorage Event will be tiggered too early.
    return await this.storeStoringAccessTokenResponse(
      storingAccessTokenResponse,
    );
  };

  private readonly storeTokenPipe = pipe(
    map(this.transformAccessTokenResponse),
    switchMap(this.storeStoringToken),
    tap((storedAccessTokenResponse) =>
      this.subjectStoredAccessTokenResponse$.next(storedAccessTokenResponse),
    ),
  );

  private readonly requestAccessToken = (
    params: StandardGrantsParams,
  ): Observable<AccessTokenResponse> => {
    return this.client.requestAccessToken({
      ...this.config.additionalParams,
      ...params,
    });
  };

  serviceInfo<T extends AccessTokenResponse, C>(
    extractor: AccessTokenResponseExtractor<T, C>,
  ): AccessTokenServiceInfo<C> {
    if (!this.extractorMap.has(extractor as AccessTokenResponseExtractor)) {
      throw new NonRegisteredExtractorError(
        extractor.constructor.name,
        this.constructor.name,
      );
    }

    return {
      serviceConfig: this.config,
      config: this.extractorMap.get(
        extractor as AccessTokenResponseExtractor,
      ) as C,
      client: this.client,
    };
  }

  private applyWatch(
    watchMode: boolean,
  ): Observable<StoredAccessTokenResponse> {
    if (watchMode) {
      return concat(this.accessTokenResponse$, this.storedAccessTokenResponse$);
    }

    return this.accessTokenResponse$;
  }

  fetchToken(watchMode = false): Observable<AccessTokenInfo> {
    return this.applyWatch(watchMode).pipe(
      map(
        (storedAccessTokenResponse): AccessTokenInfo => ({
          type: storedAccessTokenResponse.response.token_type,
          token: storedAccessTokenResponse.response.access_token,
        }),
      ),
    );
  }

  fetchResponse<R extends AccessTokenResponse = AccessTokenResponse>(
    watchMode = false,
  ): Observable<AccessTokenResponseInfo<R>> {
    return this.applyWatch(watchMode) as Observable<AccessTokenResponseInfo<R>>;
  }

  extract<T extends AccessTokenResponse, C, R>(
    extractor: AccessTokenResponseExtractor<T, C, R>,
    watchMode = false,
  ): Observable<R> {
    return this.fetchResponse<T>(watchMode).pipe(
      extractor.extractPipe(this.serviceInfo(extractor)),
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
