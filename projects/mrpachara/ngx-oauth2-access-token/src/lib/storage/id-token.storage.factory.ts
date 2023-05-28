import { Injectable, inject } from '@angular/core';

import { IdTokenNotFoundError } from '../errors';
import { KEY_VALUE_PAIR_STORAGE } from '../tokens';
import { KeyValuePairStorage, StoredIdToken } from '../types';

const tokenDataKeyName = `id-token-data` as const;

export class IdTokenStorage {
  private stoageKey = (serviceName: string) =>
    `${serviceName}-${tokenDataKeyName}` as const;

  constructor(private readonly storage: KeyValuePairStorage) {}

  async loadIdToken(serviceName: string): Promise<StoredIdToken> {
    const storedIdToken = await this.storage.loadItem<StoredIdToken>(
      this.stoageKey(serviceName),
    );

    if (storedIdToken === null) {
      throw new IdTokenNotFoundError(serviceName);
    }

    return storedIdToken;
  }

  async storeIdToken(
    serviceName: string,
    storedIdToken: StoredIdToken,
  ): Promise<StoredIdToken> {
    return await this.storage.storeItem(
      this.stoageKey(serviceName),
      storedIdToken,
    );
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
