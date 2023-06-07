import { Injectable, inject } from '@angular/core';
import { catchError, pipe, switchMap } from 'rxjs';

import { IdTokenEncryptedError, IdTokenExpiredError } from './errors';
import { extractJwt, isJwtEncryptedPayload } from './functions';
import { IdTokenStorage, IdTokenStorageFactory } from './storage';
import {
  AccessTokenResponseExtractor,
  AccessTokenResponseInfo,
  AccessTokenServiceInfo,
  ExtractorPipeReturn,
  IdTokenClaims,
  IdTokenFullConfig,
  IdTokenInfo,
  IdTokenResponse,
  JwtTokenType,
} from './types';

@Injectable({
  providedIn: 'root',
})
export class IdTokenService
  implements
    AccessTokenResponseExtractor<
      IdTokenResponse,
      IdTokenFullConfig,
      IdTokenInfo
    >
{
  private readonly storageFactory = inject(IdTokenStorageFactory);
  private readonly storage: IdTokenStorage;

  constructor() {
    this.storage = this.storageFactory.create();
  }

  private readonly storeIdToken = (
    serviceInfo: AccessTokenServiceInfo<IdTokenFullConfig>,
    token: JwtTokenType,
  ) => this.storage.storeIdToken(serviceInfo.serviceConfig.name, token);

  private readonly loadIdTokenInfo = async (
    serviceInfo: AccessTokenServiceInfo<IdTokenFullConfig>,
  ) => {
    const token = await this.storage.loadIdToken(
      serviceInfo.serviceConfig.name,
    );

    return this.extractAndValidateIdToken(
      serviceInfo.serviceConfig.name,
      token,
    );
  };

  private readonly removeIdToken = async (
    serviceInfo: AccessTokenServiceInfo<IdTokenFullConfig>,
  ) => await this.storage.removeIdToken(serviceInfo.serviceConfig.name);

  private extractAndValidateIdToken(
    serviceName: string,
    token: JwtTokenType,
  ): IdTokenInfo {
    const idTokenInfo = extractJwt<IdTokenClaims>(token);

    if (isJwtEncryptedPayload(idTokenInfo)) {
      throw new IdTokenEncryptedError(serviceName);
    }

    if (idTokenInfo.payload.exp * 1000 < Date.now()) {
      throw new IdTokenExpiredError(serviceName);
    }

    return idTokenInfo;
  }

  async onAccessTokenResponseUpdate(
    serviceInfo: AccessTokenServiceInfo<IdTokenFullConfig>,
    accessTokenResponseInfo: AccessTokenResponseInfo<IdTokenResponse>,
  ): Promise<void> {
    const token = serviceInfo.config.providedInAccessToken
      ? (accessTokenResponseInfo.response.access_token as JwtTokenType)
      : accessTokenResponseInfo.response.id_token;

    if (token) {
      await this.storeIdToken(serviceInfo, token);
    }
  }

  async onAccessTokenResponseClear(
    serviceInfo: AccessTokenServiceInfo<IdTokenFullConfig>,
  ): Promise<void> {
    await this.removeIdToken(serviceInfo);
  }

  extractPipe(
    serviceInfo: AccessTokenServiceInfo<IdTokenFullConfig>,
  ): ExtractorPipeReturn<IdTokenResponse, IdTokenInfo> {
    return pipe(
      switchMap(() => this.loadIdTokenInfo(serviceInfo)),
      catchError(() => this.loadIdTokenInfo(serviceInfo)),
    );
  }
}
