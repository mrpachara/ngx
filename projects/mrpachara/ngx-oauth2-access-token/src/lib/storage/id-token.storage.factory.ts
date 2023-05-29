import { Injectable, inject } from '@angular/core';

import { IdTokenNotFoundError } from '../errors';
import { KEY_VALUE_PAIR_STORAGE } from '../tokens';
import { JwtTokenType, KeyValuePairStorage } from '../types';

const tokenDataKeyName = `id-token-data` as const;

export type IdTokenContainer = {
  token: JwtTokenType;
};

export class IdTokenStorage {
  private stoageKey = (serviceName: string) =>
    `${serviceName}-${tokenDataKeyName}` as const;

  constructor(private readonly storage: KeyValuePairStorage) {}

  async loadIdToken(serviceName: string): Promise<JwtTokenType> {
    const storedIdTokenContainer =
      await this.storage.loadItem<IdTokenContainer>(
        this.stoageKey(serviceName),
      );

    if (storedIdTokenContainer === null) {
      throw new IdTokenNotFoundError(serviceName);
    }

    return storedIdTokenContainer.token;
  }

  async storeIdToken(
    serviceName: string,
    token: JwtTokenType,
  ): Promise<IdTokenContainer> {
    return await this.storage.storeItem(this.stoageKey(serviceName), { token });
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
