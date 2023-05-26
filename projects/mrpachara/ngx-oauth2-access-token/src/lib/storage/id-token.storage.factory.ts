import { Injectable, inject } from '@angular/core';

import {
  IdTokenEncryptedError,
  IdTokenExpiredError,
  IdTokenNotFoundError,
} from '../errors';
import { extractJwt, isJwtEncryptedPayload } from '../functions';
import { frameworkPrefix } from '../predefined';
import { KEY_VALUE_PAIR_STORAGE } from '../tokens';
import {
  IdTokenClaims,
  IdTokenInfo,
  KeyValuePairStorage,
  StoredIdToken,
} from '../types';

const tokenDataKeyName = `id-token-data`;

export class IdTokenStorage {
  private stoageKey = (serviceName: string) =>
    `${frameworkPrefix}-${serviceName}-${tokenDataKeyName}` as const;

  constructor(private readonly storage: KeyValuePairStorage) {}

  private async loadIdToken(serviceName: string): Promise<StoredIdToken> {
    const storedIdToken = await this.storage.loadItem<StoredIdToken>(
      this.stoageKey(serviceName),
    );

    if (storedIdToken === null) {
      throw new IdTokenNotFoundError(serviceName);
    }

    return storedIdToken;
  }

  async loadIdTokenInfo(serviceName: string): Promise<IdTokenInfo> {
    const storedIdToken = await this.loadIdToken(serviceName);

    const idTokenInfo = extractJwt<IdTokenClaims>(storedIdToken.token);

    if (isJwtEncryptedPayload(idTokenInfo)) {
      throw new IdTokenEncryptedError(serviceName);
    }

    if (idTokenInfo.payload.exp * 1000 < Date.now()) {
      throw new IdTokenExpiredError(serviceName);
    }

    return idTokenInfo;
  }

  async storeIdToken(
    serviceName: string,
    storedIdToken: StoredIdToken,
  ): Promise<StoredIdToken> {
    return await this.storage.storeItem(
      this.stoageKey(serviceName),
      storedIdToken,
    );
  }

  async removeIdToken(serviceName: string): Promise<void> {
    await this.storage.removeItem(this.stoageKey(serviceName));
  }
}

@Injectable({
  providedIn: 'root',
})
export class IdTokenStorageFactory {
  private readonly storage = inject(KEY_VALUE_PAIR_STORAGE);

  create(): IdTokenStorage {
    return new IdTokenStorage(this.storage);
  }
}
