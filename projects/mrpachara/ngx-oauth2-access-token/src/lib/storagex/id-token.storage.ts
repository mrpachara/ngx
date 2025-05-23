import { Injectable } from '@angular/core';

import { IdTokenNotFoundError } from '../errors';
import { DeepReadonly, EncodedJsonWeb, KeyValuePairsStorage } from '../types';

const tokenDataKeyName = `id-token-data`;

export interface IdTokenContainer {
  token: EncodedJsonWeb;
}

/** ID token storage */
@Injectable({
  providedIn: 'root',
})
export class IdTokenStorage {
  /**
   * Load ID token.
   *
   * @param storage The storage for loading
   * @returns The `Promise` of immuable ID Token
   */
  async loadIdToken(
    storage: KeyValuePairsStorage,
  ): Promise<DeepReadonly<EncodedJsonWeb>> {
    const storedIdTokenContainer =
      await storage.loadItem<IdTokenContainer>(tokenDataKeyName);

    if (storedIdTokenContainer === null) {
      throw new IdTokenNotFoundError(storage.name);
    }

    return storedIdTokenContainer.token;
  }

  /**
   * Store ID token.
   *
   * @param storage The storage for storing
   * @param token The ID token to be stored
   * @returns The `Promise` of immuable ID token
   */
  async storeIdToken(
    storage: KeyValuePairsStorage,
    token: EncodedJsonWeb,
  ): Promise<DeepReadonly<EncodedJsonWeb>> {
    const storedIdTokenContainer = await storage.storeItem(tokenDataKeyName, {
      token,
    });

    return storedIdTokenContainer.token;
  }

  /**
   * Remove ID Token.
   *
   * @param storage The storage for removing
   * @returns The `Promise` of `void`
   */
  async removeIdToken(storage: KeyValuePairsStorage): Promise<void> {
    await storage.removeItem(tokenDataKeyName);
  }
}
