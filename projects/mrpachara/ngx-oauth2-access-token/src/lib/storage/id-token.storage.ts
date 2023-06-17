import { Injectable } from '@angular/core';

import { IdTokenNotFoundError } from '../errors';
import { DeepReadonly, JwtTokenType, KeyValuePairsStorage } from '../types';

const tokenDataKeyName = `id-token-data` as const;

export type IdTokenContainer = {
  token: JwtTokenType;
};

@Injectable({
  providedIn: 'root',
})
export class IdTokenStorage {
  async loadIdToken(
    storage: KeyValuePairsStorage,
  ): Promise<DeepReadonly<JwtTokenType>> {
    const storedIdTokenContainer = await storage.loadItem<IdTokenContainer>(
      tokenDataKeyName,
    );

    if (storedIdTokenContainer === null) {
      throw new IdTokenNotFoundError(storage.name);
    }

    return storedIdTokenContainer.token;
  }

  async storeIdToken(
    storage: KeyValuePairsStorage,
    token: JwtTokenType,
  ): Promise<DeepReadonly<IdTokenContainer>> {
    return await storage.storeItem(tokenDataKeyName, { token });
  }

  async removeIdToken(storage: KeyValuePairsStorage): Promise<void> {
    await storage.removeItem(tokenDataKeyName);
  }
}
