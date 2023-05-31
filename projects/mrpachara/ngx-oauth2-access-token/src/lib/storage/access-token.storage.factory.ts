import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AccessTokenNotFoundError } from '../errors';
import { KeyValuePairStorage, StoredAccessTokenResponse } from '../types';
import { KEY_VALUE_PAIR_STORAGE } from '../tokens';

const tokenDataKeyName = `access-token-data` as const;

export class AccessTokenStorage {
  private stoageKey = () => `${this.name}-${tokenDataKeyName}` as const;

  private readonly accessToken$: Observable<StoredAccessTokenResponse | null>;

  constructor(
    private readonly name: string,
    private readonly storage: KeyValuePairStorage,
  ) {
    this.accessToken$ = this.storage.watchItem<StoredAccessTokenResponse>(
      this.stoageKey(),
    );
  }

  async loadAccessTokenResponse(): Promise<StoredAccessTokenResponse> {
    const storedAccessTokenResponse =
      await this.storage.loadItem<StoredAccessTokenResponse>(this.stoageKey());

    if (storedAccessTokenResponse === null) {
      throw new AccessTokenNotFoundError(this.name);
    }

    return storedAccessTokenResponse;
  }

  async storeAccessTokenResponse(
    storedAccessTokenResponse: StoredAccessTokenResponse,
  ): Promise<StoredAccessTokenResponse> {
    return await this.storage.storeItem(
      this.stoageKey(),
      storedAccessTokenResponse,
    );
  }

  async removeAccessTokenResponse(): Promise<void> {
    await this.storage.removeItem(this.stoageKey());
  }

  watchAccessTokenResponse(): Observable<StoredAccessTokenResponse | null> {
    return this.accessToken$;
  }
}

@Injectable({ providedIn: 'root' })
export class AccessTokenStorageFactory {
  private readonly storage = inject(KEY_VALUE_PAIR_STORAGE);
  private readonly existingNameSet = new Set<string>();

  create(name: string): AccessTokenStorage {
    if (this.existingNameSet.has(name)) {
      throw new Error(`Duplicated name '${name}' in access-token.storage.`);
    }

    this.existingNameSet.add(name);

    return new AccessTokenStorage(name, this.storage);
  }
}
