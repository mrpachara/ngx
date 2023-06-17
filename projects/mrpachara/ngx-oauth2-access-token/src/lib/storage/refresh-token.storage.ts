import { Injectable } from '@angular/core';

import { StoredRefreshToken } from './types';

import { RefreshTokenNotFoundError } from '../errors';
import { DeepReadonly, KeyValuePairsStorage } from '../types';

const tokenDataKeyName = `refresh-token-data` as const;

@Injectable({
  providedIn: 'root',
})
export class RefreshTokenStorage {
  async loadRefreshToken(
    storage: KeyValuePairsStorage,
  ): Promise<DeepReadonly<StoredRefreshToken>> {
    const storedRefreshToken = await storage.loadItem<StoredRefreshToken>(
      tokenDataKeyName,
    );

    if (storedRefreshToken === null) {
      throw new RefreshTokenNotFoundError(storage.name);
    }

    return storedRefreshToken;
  }

  async storeRefreshToken(
    storage: KeyValuePairsStorage,
    storedIdToken: StoredRefreshToken,
  ): Promise<DeepReadonly<StoredRefreshToken>> {
    return await storage.storeItem(tokenDataKeyName, storedIdToken);
  }

  async removeRefreshToken(storage: KeyValuePairsStorage): Promise<void> {
    await storage.removeItem(tokenDataKeyName);
  }
}
