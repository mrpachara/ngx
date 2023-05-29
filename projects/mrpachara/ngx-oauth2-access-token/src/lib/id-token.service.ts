import { Inject, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { IdTokenStorage, IdTokenStorageFactory } from './storage';
import {
  AccessTokenResponseExtractor,
  AccessTokenResponseInfo,
  AccessTokenResponseListener,
  ExtractorPipeReturn,
  IdTokenClaims,
  IdTokenFullConfig,
  IdTokenInfo,
  IdTokenResponse,
  JwtTokenType,
} from './types';
import { ID_TOKEN_FULL_CONFIG } from './tokens';
import { extractJwt, isJwtEncryptedPayload } from './functions';
import { IdTokenEncryptedError, IdTokenExpiredError } from './errors';
import { catchError, pipe, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IdTokenService
  implements
    AccessTokenResponseExtractor<IdTokenResponse, IdTokenInfo>,
    AccessTokenResponseListener<IdTokenResponse>
{
  private readonly http = inject(HttpClient);

  private readonly storageFactory = inject(IdTokenStorageFactory);
  private readonly storage: IdTokenStorage;

  constructor(
    @Inject(ID_TOKEN_FULL_CONFIG) private readonly config: IdTokenFullConfig,
  ) {
    this.storage = this.storageFactory.create();
  }

  private readonly storeIdToken = (serviceName: string, token: JwtTokenType) =>
    this.storage.storeIdToken(serviceName, token);

  private readonly loadIdTokenInfo = async (serviceName: string) => {
    const token = await this.storage.loadIdToken(serviceName);

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

  extractPipe(
    serviceName: string,
  ): ExtractorPipeReturn<IdTokenResponse, IdTokenInfo> {
    return pipe(
      switchMap(() => this.loadIdTokenInfo(serviceName)),
      catchError(() => this.loadIdTokenInfo(serviceName)),
    );
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
