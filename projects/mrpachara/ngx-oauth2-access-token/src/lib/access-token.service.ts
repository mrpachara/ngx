import {
  FactoryProvider,
  Inject,
  Injectable,
  InjectionToken,
  Optional,
} from '@angular/core';
import {
  catchError,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  pipe,
  race,
  share,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';

import { RefreshTokenNotFoundError } from './errors';
import { InvalidScopeError, validateAndTransformScopes } from './functions';
import { Oauth2Client } from './oauth2.client';
import {
  ACCESS_TOKEN_SERVICE_CONFIG,
  ACCESS_TOKEN_STORAGE_FACTORY,
  EXTERNAL_SOURCE_ACCESS_TOKEN,
} from './tokens';
import {
  AccessToken,
  AccessTokenServiceConfig,
  AccessTokenStorage,
  AccessTokenStorageFactory,
  AccessTokenWithType,
  ScopesType,
  StandardGrantsParams,
  StoredAccessToken,
} from './types';

export function createAccessTokenServiceProvider(
  providedToken: InjectionToken<AccessTokenService> | typeof AccessTokenService,
  config: AccessTokenServiceConfig,
  clientToken: InjectionToken<Oauth2Client> | typeof Oauth2Client,
  externalSourceToken?: InjectionToken<Observable<AccessToken>>,
  storageFactoryToken?: InjectionToken<AccessTokenStorageFactory>,
): FactoryProvider {
  return {
    provide: providedToken,
    useFactory: (
      client: Oauth2Client,
      storageFactory: AccessTokenStorageFactory,
      externalSource: Observable<AccessToken> | null = null,
    ): AccessTokenService =>
      new AccessTokenService(config, client, storageFactory, externalSource),
    deps: [
      clientToken,
      storageFactoryToken ? storageFactoryToken : ACCESS_TOKEN_STORAGE_FACTORY,
      ...(externalSourceToken ? [externalSourceToken] : []),
    ],
  };
}

const latencyTime = 30 * 1000;
const defaultAccessTokenTTL = 10 * 60 * 1000;

@Injectable()
export class AccessTokenService {
  private readonly loadStoredAccessToken = () => this.storage.loadAccessToken();

  private readonly loadRefreshToken = () => this.storage.loadRefreshToken();

  private readonly storeStoringAccessToken = (accessToken: StoredAccessToken) =>
    this.storage.storeAccessToken(accessToken);

  private readonly storeRefreshToken = (refreshToken: string) =>
    this.storage.storeRefreshToken(refreshToken);

  private readonly transformToken = (
    accessToken: AccessToken,
  ): [StoredAccessToken, string | undefined] => {
    const currentTime = Date.now();

    const { expires_in, refresh_token, ...extractedAccessToken } = accessToken;

    const storingAccessToken: StoredAccessToken = {
      ...extractedAccessToken,
      expires_at:
        currentTime +
        (expires_in ? expires_in * 1000 - latencyTime : defaultAccessTokenTTL),
    };

    return [storingAccessToken, refresh_token];
  };

  private readonly storeStoringToken = ([storingAccessToken, refreshToken]: [
    StoredAccessToken,
    string | undefined,
  ]) => {
    return forkJoin([
      this.storeStoringAccessToken(storingAccessToken),
      refreshToken ? this.storeRefreshToken(refreshToken) : of(undefined),
    ]).pipe(map(([storedAccessToken]) => storedAccessToken));
  };

  private readonly storeTokenPipe = pipe(
    map(this.transformToken),
    switchMap(this.storeStoringToken),
  );

  private readonly requestAccessToken = (
    params: StandardGrantsParams,
  ): Observable<AccessToken> => {
    return this.client.requestAccessToken({
      ...this.config.additionalParams,
      ...params,
    });
  };

  private readonly accessToken$: Observable<AccessTokenWithType>;

  private readonly storage: AccessTokenStorage;
  constructor(
    @Inject(ACCESS_TOKEN_SERVICE_CONFIG)
    private readonly config: AccessTokenServiceConfig,
    private readonly client: Oauth2Client,
    @Inject(ACCESS_TOKEN_STORAGE_FACTORY)
    storageFactory: AccessTokenStorageFactory,
    @Optional()
    @Inject(EXTERNAL_SOURCE_ACCESS_TOKEN)
    private readonly externalSource: Observable<AccessToken> | null = null,
  ) {
    this.storage = storageFactory.create(this.config.name);

    // NOTE: multiple tabs can request refresh_token at the same time
    //       so use race() for finding the winner.
    this.accessToken$ = race(
      this.loadStoredAccessToken().pipe(
        catchError((accessTokenErr: unknown) => {
          return this.exchangeRefreshToken().pipe(
            this.storeTokenPipe,
            catchError((refreshTokenErr: unknown) => {
              if (refreshTokenErr instanceof RefreshTokenNotFoundError) {
                return throwError(() => accessTokenErr);
              }

              return throwError(() => refreshTokenErr);
            }),
          );
        }),
        catchError((err) => {
          if (this.externalSource) {
            console.log(err);
            return this.externalSource.pipe(this.storeTokenPipe);
          } else {
            return throwError(() => err);
          }
        }),
        tap(
          () =>
            this.config.debug &&
            console.debug('access-token-race:', 'I am a winner!!!'),
        ),
      ),
      // NOTE: Access token is assigned by another tab.
      this.storage.watchAccessToken().pipe(
        filter(
          (storedTokenData): storedTokenData is StoredAccessToken =>
            storedTokenData !== null,
        ),
        filter((storedTokenData) => storedTokenData.expires_at >= Date.now()),
        take(1),
        tap(
          () =>
            this.config.debug &&
            console.debug('access-token-race:', 'I am a loser!!!'),
        ),
      ),
    ).pipe(
      map(
        (storedAccessToken): AccessTokenWithType => ({
          token_type: storedAccessToken.token_type,
          access_token: storedAccessToken.access_token,
        }),
      ),
      share(),
    );
  }

  fetchAccessToken(): Observable<AccessTokenWithType> {
    return this.accessToken$;
  }

  exchangeRefreshToken(scopes?: ScopesType): Observable<AccessToken> {
    return this.loadRefreshToken().pipe(
      switchMap((refreshToken) => {
        const scope = scopes ? validateAndTransformScopes(scopes) : null;

        if (scope instanceof InvalidScopeError) {
          return throwError(() => scope);
        }

        return this.requestAccessToken({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          ...(scope ? { scope: scope } : {}),
        });
      }),
    );
  }

  setAccessToken(accessToken: AccessToken): Observable<AccessToken> {
    return of(accessToken).pipe(
      this.storeTokenPipe,
      map(() => accessToken),
    );
  }

  removeAccessToken(): Observable<true> {
    return this.storage.removeAccessToken();
  }

  clearToken() {
    this.storage.clearToken();
  }
}
