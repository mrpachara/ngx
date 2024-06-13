import { Injectable } from '@angular/core';

import { RefreshTokenNotFoundError } from '../errors';
import { DeepReadonly, KeyValuePairsStorage } from '../types';
import { StoredRefreshToken } from './types';

const tokenDataKeyName = `refresh-token-data`;

/** Refresh token storage */
@Injectable({
  providedIn: 'root',
})
export class RefreshTokenStorage {
  /**
   * Load refresh token.
   *
   * @param storage The storage for loading
   * @returns The `Promise` of immuable stored refresh token
   */
  async loadRefreshToken(
    storage: KeyValuePairsStorage,
  ): Promise<DeepReadonly<StoredRefreshToken>> {
    const storedRefreshToken =
      await storage.loadItem<StoredRefreshToken>(tokenDataKeyName);

    if (storedRefreshToken === null) {
      throw new RefreshTokenNotFoundError(storage.name);
    }

    return storedRefreshToken;
  }

  /**
   * Store refresh token.
   *
   * @param storage The storage for storing
   * @param soringRefreshToken The refresh token to be stored
   * @returns The `Promise` of immuable stored refresh token
   */
  async storeRefreshToken(
    storage: KeyValuePairsStorage,
    storingRefreshToken: StoredRefreshToken,
  ): Promise<DeepReadonly<StoredRefreshToken>> {
    return await storage.storeItem(tokenDataKeyName, storingRefreshToken);
  }

  /**
   * Remove refresh token.
   *
   * @param storage The storage for removing
   * @returns The `Promise` of `void`
   */
  async removeRefreshToken(storage: KeyValuePairsStorage): Promise<void> {
    await storage.removeItem(tokenDataKeyName);
  }
}
