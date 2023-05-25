import { Inject, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { IdTokenStorage, IdTokenStorageFactory } from './storage';
import {
  IdTokenFullConfig,
  IdTokenInfo,
  JwtTokenType,
  StoredIdToken,
  StoredIdTokenParams,
  TokenExtractor,
} from './types';
import { ID_TOKEN_FULL_CONFIG } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class IdTokenService
  implements TokenExtractor<StoredIdTokenParams, StoredIdToken>
{
  protected readonly http = inject(HttpClient);

  protected readonly storageFactory = inject(IdTokenStorageFactory);
  protected readonly storage: IdTokenStorage;

  constructor(
    @Inject(ID_TOKEN_FULL_CONFIG) protected readonly config: IdTokenFullConfig,
  ) {
    this.storage = this.storageFactory.create(this.config.name);
  }

  async extractToken(
    storingAccessToken: StoredIdTokenParams,
  ): Promise<StoredIdToken | void> {
    const token = this.config.providedInAccessToken
      ? (storingAccessToken.access_token as JwtTokenType)
      : storingAccessToken.id_token;

    if (token) {
      return await this.storage.storeIdToken({
        token: token,
      });
    }
  }

  async fetchIdToken(): Promise<IdTokenInfo> {
    return this.storage.loadIdTokenInfo();
  }
}
