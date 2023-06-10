import { Injectable, inject } from '@angular/core';
import { Observable, catchError, defer, pipe, switchMap } from 'rxjs';

import { RefreshTokenExpiredError } from '../errors';
import {
  RefreshTokenStorage,
  RefreshTokenStorageFactory,
} from '../storage/refresh-token.storage.factory';
import {
  AccessTokenResponse,
  AccessTokenResponseExtractor,
  AccessTokenResponseInfo,
  AccessTokenServiceInfo,
  ExtractorPipeReturn,
  RefreshTokenFullConfig,
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

  fetchToken(
    serviceInfo: AccessTokenServiceInfo<RefreshTokenFullConfig>,
  ): Observable<string> {
    return defer(() => this.loadRefreshToken(serviceInfo));
  }
}
