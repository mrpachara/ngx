import { Injectable } from '@angular/core';

import { IdTokenNotFoundError } from '../errors';
import { JwtTokenType, KeyValuePairStorage } from '../types';

const tokenDataKeyName = `id-token-data` as const;

export type IdTokenContainer = {
  token: JwtTokenType;
};

@Injectable({
  providedIn: 'root',
})
export class IdTokenStorage {
  async loadIdToken(storage: KeyValuePairStorage): Promise<JwtTokenType> {
    const storedIdTokenContainer = await storage.loadItem<IdTokenContainer>(
      tokenDataKeyName,
    );

    if (storedIdTokenContainer === null) {
      throw new IdTokenNotFoundError(storage.name);
    }

    return storedIdTokenContainer.token;
  }

  async storeIdToken(
    storage: KeyValuePairStorage,
    token: JwtTokenType,
  ): Promise<IdTokenContainer> {
    return await storage.storeItem(tokenDataKeyName, { token });
  }

  async removeIdToken(storage: KeyValuePairStorage): Promise<void> {
    await storage.removeItem(tokenDataKeyName);
  }
}
