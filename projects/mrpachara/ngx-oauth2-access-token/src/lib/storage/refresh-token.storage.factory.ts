import { Injectable, inject } from '@angular/core';

import { frameworkPrefix } from '../predefined';
import { KEY_VALUE_PAIR_STORAGE } from '../tokens';
import { KeyValuePairStorage, StoredRefreshToken } from '../types';
import { RefreshTokenExpiredError, RefreshTokenNotFoundError } from '../errors';

const tokenDataKeyName = `refresh-token-data`;

export class RefreshTokenStorage {
  private stoageKey = (serviceName: string) =>
    `${frameworkPrefix}-${serviceName}-${tokenDataKeyName}` as const;

  constructor(private readonly storage: KeyValuePairStorage) {}

  async loadRefreshToken(serviceName: string): Promise<StoredRefreshToken> {
    const storedRefreshToken = await this.storage.loadItem<StoredRefreshToken>(
      this.stoageKey(serviceName),
    );

    if (storedRefreshToken === null) {
      throw new RefreshTokenNotFoundError(serviceName);
    }

    if (storedRefreshToken.expires_at < Date.now()) {
      throw new RefreshTokenExpiredError(serviceName);
    }

    return storedRefreshToken;
  }

  async storeRefreshToken(
    serviceName: string,
    storedIdToken: StoredRefreshToken,
  ): Promise<StoredRefreshToken> {
    // {
    //   refresh_token: refresh_token,
    //   expires_at: currentTime + this.config.refreshTokenTtl - latencyTime,
    // }

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
