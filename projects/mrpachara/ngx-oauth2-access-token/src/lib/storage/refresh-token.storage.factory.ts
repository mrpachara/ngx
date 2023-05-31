import { Injectable, inject } from '@angular/core';

import { RefreshTokenNotFoundError } from '../errors';
import { KEY_VALUE_PAIR_STORAGE } from '../tokens';
import { KeyValuePairStorage, StoredRefreshToken } from '../types';

const tokenDataKeyName = `refresh-token-data` as const;

export class RefreshTokenStorage {
  private stoageKey = (serviceName: string) =>
    `${serviceName}-${tokenDataKeyName}` as const;

  constructor(private readonly storage: KeyValuePairStorage) {}

  async loadRefreshToken(serviceName: string): Promise<StoredRefreshToken> {
    const storedRefreshToken = await this.storage.loadItem<StoredRefreshToken>(
      this.stoageKey(serviceName),
    );

    if (storedRefreshToken === null) {
      throw new RefreshTokenNotFoundError(serviceName);
    }

    return storedRefreshToken;
  }

  async storeRefreshToken(
    serviceName: string,
    storedIdToken: StoredRefreshToken,
  ): Promise<StoredRefreshToken> {
    return await this.storage.storeItem(
      this.stoageKey(serviceName),
      storedIdToken,
    );
  }

  async removeRefreshToken(serviceName: string): Promise<void> {
    await this.storage.removeItem(this.stoageKey(serviceName));
  }
}

@Injectable({
  providedIn: 'root',
})
export class RefreshTokenStorageFactory {
  private readonly storage = inject(KEY_VALUE_PAIR_STORAGE);

  create(): RefreshTokenStorage {
    return new RefreshTokenStorage(this.storage);
  }
}
