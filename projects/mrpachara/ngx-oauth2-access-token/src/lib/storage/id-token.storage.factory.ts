import { Injectable, inject } from '@angular/core';

import { KEY_VALUE_PAIR_STORAGE } from '../tokens';
import {
  IdTokenClaims,
  IdTokenInfo,
  KeyValuePairStorage,
  StoredIdToken,
} from '../types';
import {
  IdTokenEncryptedError,
  IdTokenExpiredError,
  IdTokenNotFoundError,
} from '../errors';
import { extractJwt, isJwtEncryptedPayload } from '../functions';

const tokenDataKeyName = `id-token-data`;

export class IdTokenStorage {
  private stoageKey = () => `${this.name}-${tokenDataKeyName}` as const;

  constructor(
    private readonly name: string,
    private readonly storage: KeyValuePairStorage,
  ) {}

  private async loadIdToken(): Promise<StoredIdToken> {
    const storedIdToken = await this.storage.loadItem<StoredIdToken>(
      this.stoageKey(),
    );

    if (storedIdToken === null) {
      throw new IdTokenNotFoundError(this.name);
    }

    return storedIdToken;
  }

  async loadIdTokenInfo(): Promise<IdTokenInfo> {
    const storedIdToken = await this.loadIdToken();

    const idTokenInfo = extractJwt<IdTokenClaims>(storedIdToken.token);

    if (isJwtEncryptedPayload(idTokenInfo)) {
      throw new IdTokenEncryptedError(this.name);
    }

    if (idTokenInfo.payload.exp * 1000 < Date.now()) {
      throw new IdTokenExpiredError(this.name);
    }

    return idTokenInfo;
  }

  async storeIdToken(storedIdToken: StoredIdToken): Promise<StoredIdToken> {
    return await this.storage.storeItem(this.stoageKey(), storedIdToken);
  }

  async removeIdToken(): Promise<void> {
    await this.storage.removeItem(this.stoageKey());
  }
}

@Injectable({
  providedIn: 'root',
})
export class IdTokenStorageFactory {
  private readonly storage = inject(KEY_VALUE_PAIR_STORAGE);
  private readonly existingNameSet = new Set<string>();

  create(name: string): IdTokenStorage {
    if (this.existingNameSet.has(name)) {
      throw new Error(`Duplicated name '${name}' in id-token.storage.`);
    }

    this.existingNameSet.add(name);

    return new IdTokenStorage(name, this.storage);
  }
}
