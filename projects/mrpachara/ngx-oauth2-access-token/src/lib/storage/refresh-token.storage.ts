import { Injectable } from '@angular/core';

import { StoredRefreshToken } from './types';

import { RefreshTokenNotFoundError } from '../errors';
import { KeyValuePairStorage } from '../types';

const tokenDataKeyName = `refresh-token-data` as const;

@Injectable({
  providedIn: 'root',
})
export class RefreshTokenStorage {
  async loadRefreshToken(
    storage: KeyValuePairStorage,
  ): Promise<StoredRefreshToken> {
    const storedRefreshToken = await storage.loadItem<StoredRefreshToken>(
      tokenDataKeyName,
    );

    if (storedRefreshToken === null) {
      throw new RefreshTokenNotFoundError(storage.name);
    }

    return storedRefreshToken;
  }

  async storeRefreshToken(
    storage: KeyValuePairStorage,
    storedIdToken: StoredRefreshToken,
  ): Promise<StoredRefreshToken> {
    return await storage.storeItem(tokenDataKeyName, storedIdToken);
  }

  async removeRefreshToken(storage: KeyValuePairStorage): Promise<void> {
    await storage.removeItem(tokenDataKeyName);
  }
}
