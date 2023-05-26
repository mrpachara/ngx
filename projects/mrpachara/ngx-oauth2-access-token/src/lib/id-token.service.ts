import { Inject, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { IdTokenStorage, IdTokenStorageFactory } from './storage';
import {
  IdTokenFullConfig,
  IdTokenInfo,
  JwtTokenType,
  StoredIdTokenParams,
  TokenResponseExtractor,
  TokenResponseListener,
} from './types';
import { ID_TOKEN_FULL_CONFIG } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class IdTokenService
  implements
    TokenResponseExtractor<StoredIdTokenParams, IdTokenInfo>,
    TokenResponseListener<StoredIdTokenParams>
{
  protected readonly http = inject(HttpClient);

  protected readonly storageFactory = inject(IdTokenStorageFactory);
  protected readonly storage: IdTokenStorage;

  constructor(
    @Inject(ID_TOKEN_FULL_CONFIG) protected readonly config: IdTokenFullConfig,
  ) {
    this.storage = this.storageFactory.create();
  }

  private readonly setIdToken = async (
    serviceName: string,
    token: JwtTokenType,
  ) =>
    await this.storage.storeIdToken(serviceName, {
      token: token,
    });

  private readonly loatIdTokenInfo = async (serviceName: string) =>
    await this.storage.loadIdTokenInfo(serviceName);

  async fetchExistedExtractedResult(serviceName: string): Promise<IdTokenInfo> {
    return await this.loatIdTokenInfo(serviceName);
  }

  async extractTokenResponse(
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

  async onTokenResponseUpdate(
    serviceName: string,
    storingAccessToken: StoredIdTokenParams,
  ): Promise<void> {
    const token = this.config.providedInAccessToken
      ? (storingAccessToken.access_token as JwtTokenType)
      : storingAccessToken.id_token;

    if (token) {
      await this.setIdToken(serviceName, token);
    }
  }
}
