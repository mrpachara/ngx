import { Inject, Injectable, inject } from '@angular/core';
import {
  Observable,
  catchError,
  defer,
  pipe,
  switchMap,
  throwError,
} from 'rxjs';

import { InvalidScopeError, RefreshTokenExpiredError } from './errors';
import {
  RefreshTokenStorage,
  RefreshTokenStorageFactory,
} from './storage/refresh-token.storage.factory';
import { Oauth2Client } from './oauth2.client';
import { ACCESS_TOKEN_FULL_CONFIG } from './tokens';
import {
  AccessTokenFullConfig,
  AccessTokenResponse,
  AccessTokenResponseExtractor,
  AccessTokenResponseInfo,
  AccessTokenResponseListener,
  ExtractorPipeReturn,
  Scopes,
  StandardGrantsParams,
} from './types';
import { validateAndTransformScopes } from './functions';

const latencyTime = 2 * 5 * 1000;

@Injectable({
  providedIn: 'root',
})
export class RefreshTokenService
  implements
    AccessTokenResponseListener<AccessTokenResponse>,
    AccessTokenResponseExtractor<AccessTokenResponse, string>
{
  private readonly storageFactory = inject(RefreshTokenStorageFactory);
  private readonly storage: RefreshTokenStorage;

  constructor(
    @Inject(ACCESS_TOKEN_FULL_CONFIG)
    protected readonly config: AccessTokenFullConfig,
    protected readonly client: Oauth2Client,
  ) {
    this.storage = this.storageFactory.create();
  }

  private readonly loadRefreshToken = async (serviceName: string) => {
    const storedRefreshToken = await this.storage.loadRefreshToken(serviceName);

    if (storedRefreshToken.expiresAt < Date.now()) {
      throw new RefreshTokenExpiredError(serviceName);
    }

    return storedRefreshToken.token;
  };

  private readonly storeRefreshToken = (
    serviceName: string,
    token: string,
    currentTime: number,
  ) =>
    this.storage.storeRefreshToken(serviceName, {
      expiresAt: currentTime + this.config.refreshTokenTtl - latencyTime,
      token,
    });

  private readonly removeRefreshToken = (serviceName: string) =>
    this.storage.removeRefreshToken(serviceName);

  private readonly requestAccessToken = (
    params: StandardGrantsParams,
  ): Observable<AccessTokenResponse> => {
    return this.client.requestAccessToken({
      ...this.config.additionalParams,
      ...params,
    });
  };

  async onAccessTokenResponseUpdate(
    serviceName: string,
    accessTokenResponseInfo: AccessTokenResponseInfo<AccessTokenResponse>,
  ): Promise<void> {
    if (accessTokenResponseInfo.response.refresh_token) {
      await this.storeRefreshToken(
        serviceName,
        accessTokenResponseInfo.response.refresh_token,
        accessTokenResponseInfo.createdAt,
      );
    }
  }

  async onAccessTokenResponseClear(serviceName: string): Promise<void> {
    await this.removeRefreshToken(serviceName);
  }

  extractPipe(
    serviceName: string,
  ): ExtractorPipeReturn<AccessTokenResponse, string> {
    return pipe(
      switchMap(() => this.loadRefreshToken(serviceName)),
      catchError(() => this.loadRefreshToken(serviceName)),
    );
  }

  async fetchToken(serviceName: string): Promise<string> {
    return await this.loadRefreshToken(serviceName);
  }

  exchangeRefreshToken(
    serviceName: string,
    scopes?: Scopes,
  ): Observable<AccessTokenResponse> {
    return defer(() => this.loadRefreshToken(serviceName)).pipe(
      switchMap((token) => {
        const scope = scopes ? validateAndTransformScopes(scopes) : null;

        if (scope instanceof InvalidScopeError) {
          return throwError(() => scope);
        }

        return this.requestAccessToken({
          grant_type: 'refresh_token',
          refresh_token: token,
          ...(scope ? { scope } : {}),
        });
      }),
    );
  }
}
