import { Inject, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { IdTokenStorage, IdTokenStorageFactory } from './storage';
import {
  AccessTokenResponseExtractor,
  AccessTokenResponseInfo,
  AccessTokenResponseListener,
  IdTokenClaims,
  IdTokenFullConfig,
  IdTokenInfo,
  IdTokenResponse,
  JwtTokenType,
} from './types';
import { ID_TOKEN_FULL_CONFIG } from './tokens';
import { extractJwt, isJwtEncryptedPayload } from './functions';
import { IdTokenEncryptedError, IdTokenExpiredError } from './errors';

@Injectable({
  providedIn: 'root',
})
export class IdTokenService
  implements
    AccessTokenResponseExtractor<IdTokenResponse, IdTokenInfo>,
    AccessTokenResponseListener<IdTokenResponse>
{
  protected readonly http = inject(HttpClient);

  protected readonly storageFactory = inject(IdTokenStorageFactory);
  protected readonly storage: IdTokenStorage;

  constructor(
    @Inject(ID_TOKEN_FULL_CONFIG) protected readonly config: IdTokenFullConfig,
  ) {
    this.storage = this.storageFactory.create();
  }

  private readonly storeIdToken = (serviceName: string, token: JwtTokenType) =>
    this.storage.storeIdToken(serviceName, {
      token: token,
    });

  private readonly loadIdTokenInfo = async (serviceName: string) => {
    const { token } = await this.storage.loadIdToken(serviceName);

    return this.extractAndValidateIdToken(serviceName, token);
  };

  private readonly removeIdToken = async (serviceName: string) =>
    await this.storage.removeIdToken(serviceName);

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

  async fetchExistedExtractedResult(serviceName: string): Promise<IdTokenInfo> {
    return await this.loadIdTokenInfo(serviceName);
  }

  async extractAccessTokenResponse(
    serviceName: string,
    _: AccessTokenResponseInfo<IdTokenResponse>,
    throwError: boolean,
  ): Promise<IdTokenInfo | null> {
    try {
      return await this.fetchExistedExtractedResult(serviceName);
    } catch (err) {
      if (throwError) {
        throw err;
      }

      return null;
    }
  }

  async onAccessTokenResponseUpdate(
    serviceName: string,
    accessTokenResponseInfo: AccessTokenResponseInfo<IdTokenResponse>,
  ): Promise<void> {
    const token = this.config.providedInAccessToken
      ? (accessTokenResponseInfo.response.access_token as JwtTokenType)
      : accessTokenResponseInfo.response.id_token;

    if (token) {
      await this.storeIdToken(serviceName, token);
    }
  }

  async onAccessTokenResponseClear(serviceName: string): Promise<void> {
    await this.removeIdToken(serviceName);
  }
}
