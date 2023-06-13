import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { StoredAccessTokenResponse } from './types';

import { AccessTokenNotFoundError } from '../errors';
import { KeyValuePairStorage } from '../types';
import { KEY_VALUE_PAIR_STORAGE_FACTORY } from '../tokens';

const tokenDataKeyName = `access-token-data` as const;

export class AccessTokenStorage {
  private readonly accessTokenResponse$: Observable<StoredAccessTokenResponse | null>;

  get keyValuePairStorage() {
    return this.storage;
  }

  constructor(private readonly storage: KeyValuePairStorage) {
    this.accessTokenResponse$ =
      this.storage.watchItem<StoredAccessTokenResponse>(tokenDataKeyName);
  }

  async loadAccessTokenResponse(): Promise<StoredAccessTokenResponse> {
    const storedAccessTokenResponse =
      await this.storage.loadItem<StoredAccessTokenResponse>(tokenDataKeyName);

    if (storedAccessTokenResponse === null) {
      throw new AccessTokenNotFoundError(this.storage.name);
    }

    return storedAccessTokenResponse;
  }

  async storeAccessTokenResponse(
    storedAccessTokenResponse: StoredAccessTokenResponse,
  ): Promise<StoredAccessTokenResponse> {
    return await this.storage.storeItem(
      tokenDataKeyName,
      storedAccessTokenResponse,
    );
  }

  async removeAccessTokenResponse(): Promise<void> {
    await this.storage.removeItem(tokenDataKeyName);
  }

  watchAccessTokenResponse(): Observable<StoredAccessTokenResponse | null> {
    return this.accessTokenResponse$;
  }
}

@Injectable({ providedIn: 'root' })
export class AccessTokenStorageFactory {
  private readonly storageFactory = inject(KEY_VALUE_PAIR_STORAGE_FACTORY);
  private readonly existingNameSet = new Set<string>();

  create(name: string): AccessTokenStorage {
    if (this.existingNameSet.has(name)) {
      throw new Error(`Duplicated name '${name}' in access-token.storage.`);
    }

    this.existingNameSet.add(name);

    return new AccessTokenStorage(this.storageFactory.create(name));
  }
}
