import { Injectable, inject } from '@angular/core';
import { catchError, pipe, switchMap } from 'rxjs';

import { IdTokenEncryptedError, IdTokenExpiredError } from '../errors';
import { extractJwt, isJwtEncryptedPayload } from '../helpers';
import { IdTokenStorage } from '../storages';
import {
  AccessTokenResponseExtractor,
  AccessTokenResponseInfo,
  AccessTokenServiceInfo,
  DeepReadonly,
  ExtractorPipeReturn,
  IdTokenClaims,
  IdTokenFullConfig,
  IdTokenInfo,
  IdTokenResponse,
  JwtToken,
} from '../types';

/** ID token service */
@Injectable({
  providedIn: 'root',
})
export class IdTokenService
  implements
    AccessTokenResponseExtractor<
      IdTokenResponse,
      IdTokenFullConfig,
      DeepReadonly<IdTokenInfo>
    >
{
  private readonly storage = inject(IdTokenStorage);

  private readonly storeIdToken = (
    serviceInfo: AccessTokenServiceInfo<IdTokenFullConfig>,
    token: JwtToken,
  ) => this.storage.storeIdToken(serviceInfo.storage, token);

  private readonly loadIdTokenInfo = async (
    serviceInfo: AccessTokenServiceInfo<IdTokenFullConfig>,
  ) => {
    const token = await this.storage.loadIdToken(serviceInfo.storage);

    return this.extractAndValidateIdToken(
      serviceInfo.serviceConfig.name,
      token,
    );
  };

  private readonly removeIdToken = async (
    serviceInfo: AccessTokenServiceInfo<IdTokenFullConfig>,
  ) => await this.storage.removeIdToken(serviceInfo.storage);

  private extractAndValidateIdToken(
    serviceName: string,
    token: JwtToken,
  ): DeepReadonly<IdTokenInfo> {
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
    accessTokenResponseInfo: DeepReadonly<
      AccessTokenResponseInfo<IdTokenResponse>
    >,
  ): Promise<void> {
    const token = serviceInfo.config.providedInAccessToken
      ? (accessTokenResponseInfo.response.access_token as JwtToken)
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
  ): ExtractorPipeReturn<IdTokenResponse, DeepReadonly<IdTokenInfo>> {
    return pipe(
      switchMap(() => this.loadIdTokenInfo(serviceInfo)),
      catchError(() => this.loadIdTokenInfo(serviceInfo)),
    );
  }
}
