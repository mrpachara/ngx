import { Injectable, inject } from '@angular/core';
import {
  Observable,
  catchError,
  defer,
  pipe,
  switchMap,
  throwError,
} from 'rxjs';

import { InvalidScopeError, RefreshTokenExpiredError } from '../errors';
import { validateAndTransformScopes } from '../functions';
import {
  RefreshTokenStorage,
  RefreshTokenStorageFactory,
} from '../storage/refresh-token.storage.factory';
import {
  AccessTokenResponse,
  AccessTokenResponseExtractor,
  AccessTokenResponseInfo,
  AccessTokenServiceInfo,
  AccessTokenServiceInfoProvidable,
  ExtractorPipeReturn,
  RefreshTokenFullConfig,
  Scopes,
  StandardGrantsParams,
} from '../types';

const latencyTime = 2 * 5 * 1000;

@Injectable({
  providedIn: 'root',
})
export class RefreshTokenService
  implements
    AccessTokenResponseExtractor<
      AccessTokenResponse,
      RefreshTokenFullConfig,
      string
    >
{
  private readonly storageFactory = inject(RefreshTokenStorageFactory);
  private readonly storage: RefreshTokenStorage;

  constructor() {
    this.storage = this.storageFactory.create();
  }

  private readonly loadRefreshToken = async (
    serviceInfo: AccessTokenServiceInfo<RefreshTokenFullConfig>,
  ) => {
    const storedRefreshToken = await this.storage.loadRefreshToken(
      serviceInfo.serviceConfig.name,
    );

    if (storedRefreshToken.expiresAt < Date.now()) {
      throw new RefreshTokenExpiredError(serviceInfo.serviceConfig.name);
    }

    return storedRefreshToken.token;
  };

  private readonly storeRefreshToken = (
    serviceInfo: AccessTokenServiceInfo<RefreshTokenFullConfig>,
    token: string,
    currentTime: number,
  ) =>
    this.storage.storeRefreshToken(serviceInfo.serviceConfig.name, {
      expiresAt: currentTime + serviceInfo.config.refreshTokenTtl - latencyTime,
      token,
    });

  private readonly removeRefreshToken = (
    serviceInfo: AccessTokenServiceInfo<RefreshTokenFullConfig>,
  ) => this.storage.removeRefreshToken(serviceInfo.serviceConfig.name);

  private readonly requestAccessToken = (
    serviceInfo: AccessTokenServiceInfo<RefreshTokenFullConfig>,
    params: StandardGrantsParams,
  ): Observable<AccessTokenResponse> => {
    return serviceInfo.client.requestAccessToken({
      ...serviceInfo.serviceConfig.additionalParams,
      ...params,
    });
  };

  async onAccessTokenResponseUpdate(
    serviceInfo: AccessTokenServiceInfo<RefreshTokenFullConfig>,
    accessTokenResponseInfo: AccessTokenResponseInfo<AccessTokenResponse>,
  ): Promise<void> {
    if (accessTokenResponseInfo.response.refresh_token) {
      await this.storeRefreshToken(
        serviceInfo,
        accessTokenResponseInfo.response.refresh_token,
        accessTokenResponseInfo.createdAt,
      );
    }
  }

  async onAccessTokenResponseClear(
    serviceInfo: AccessTokenServiceInfo<RefreshTokenFullConfig>,
  ): Promise<void> {
    await this.removeRefreshToken(serviceInfo);
  }

  extractPipe(
    serviceInfo: AccessTokenServiceInfo<RefreshTokenFullConfig>,
  ): ExtractorPipeReturn<AccessTokenResponse, string> {
    return pipe(
      switchMap(() => this.loadRefreshToken(serviceInfo)),
      catchError(() => this.loadRefreshToken(serviceInfo)),
    );
  }

  /**
   * Exchange refresh token for access token.
   *
   * **Warning**, this method doesn't store the new access token. The new acess
   * token must be sotred manually by using `AccessTokenService`.
   */
  exchangeRefreshToken(
    serviceInfoProvidable: AccessTokenServiceInfoProvidable,
    scopes?: Scopes,
  ): Observable<AccessTokenResponse> {
    const serviceInfo = serviceInfoProvidable.serviceInfo(this);

    return defer(() => this.loadRefreshToken(serviceInfo)).pipe(
      switchMap((token) => {
        const scope = scopes ? validateAndTransformScopes(scopes) : null;

        if (scope instanceof InvalidScopeError) {
          return throwError(() => scope);
        }

        return this.requestAccessToken(serviceInfo, {
          grant_type: 'refresh_token',
          refresh_token: token,
          ...(scope ? { scope } : {}),
        });
      }),
    );
  }
}
