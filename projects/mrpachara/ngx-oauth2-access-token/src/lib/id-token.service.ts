import { Inject, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { IdTokenStorage, IdTokenStorageFactory } from './storage';
import {
  AccessTokenResponseExtractor,
  AccessTokenResponseListener,
  IdTokenFullConfig,
  IdTokenInfo,
  JwtTokenType,
  StoredIdTokenParams,
} from './types';
import { ID_TOKEN_FULL_CONFIG } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class IdTokenService
  implements
    AccessTokenResponseExtractor<StoredIdTokenParams, IdTokenInfo>,
    AccessTokenResponseListener<StoredIdTokenParams>
{
  protected readonly http = inject(HttpClient);

  protected readonly storageFactory = inject(IdTokenStorageFactory);
  protected readonly storage: IdTokenStorage;

  constructor(
    @Inject(ID_TOKEN_FULL_CONFIG) protected readonly config: IdTokenFullConfig,
  ) {
    this.storage = this.storageFactory.create();
  }

  private readonly setIdToken = (serviceName: string, token: JwtTokenType) =>
    this.storage.storeIdToken(serviceName, {
      token: token,
    });

  private readonly loadIdTokenInfo = (serviceName: string) =>
    this.storage.loadIdTokenInfo(serviceName);

  private readonly removeIdToken = async (serviceName: string) =>
    await this.storage.removeIdToken(serviceName);

  async fetchExistedExtractedResult(serviceName: string): Promise<IdTokenInfo> {
    return await this.loadIdTokenInfo(serviceName);
  }

  async extractAccessTokenResponse(
    serviceName: string,
    _: StoredIdTokenParams,
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
    storingAccessTokenResponse: StoredIdTokenParams,
  ): Promise<void> {
    const token = this.config.providedInAccessToken
      ? (storingAccessTokenResponse.access_token as JwtTokenType)
      : storingAccessTokenResponse.id_token;

    if (token) {
      await this.setIdToken(serviceName, token);
    }
  }

  async onAccessTokenResponseClear(serviceName: string): Promise<void> {
    await this.removeIdToken(serviceName);
  }
}
