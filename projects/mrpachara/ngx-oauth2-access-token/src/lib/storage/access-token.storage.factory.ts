import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AccessTokenNotFoundError } from '../errors';
import { StoredAccessTokenResponse } from '../storages/types';
import { KEY_VALUE_PAIR_STORAGE_FACTORY } from '../tokens';
import { DeepReadonly, KeyValuePairsStorage } from '../types';

const tokenDataKeyName = `access-token-data`;

/** Access token storage */
export class AccessTokenStorage {
  private readonly accessTokenResponse$: Observable<
    DeepReadonly<StoredAccessTokenResponse | null>
  >;

  /** The backend key-value pairs storage */
  get keyValuePairsStorage() {
    return this.storage;
  }

  constructor(private readonly storage: KeyValuePairsStorage) {
    this.accessTokenResponse$ =
      this.storage.watchItem<StoredAccessTokenResponse>(tokenDataKeyName);
  }

  /**
   * Load stored access token response.
   *
   * @returns The `Promise` of immuable stored access token response
   */
  async loadAccessTokenResponse(): Promise<
    DeepReadonly<StoredAccessTokenResponse>
  > {
    const storedAccessTokenResponse =
      await this.storage.loadItem<StoredAccessTokenResponse>(tokenDataKeyName);

    if (storedAccessTokenResponse === null) {
      throw new AccessTokenNotFoundError(this.storage.name);
    }

    return storedAccessTokenResponse;
  }

  /**
   * Store storing access token response.
   *
   * @param storingAccessTokenResponse The access token response information to
   *   be stored
   * @returns The `Promise` of immuable stored access token response
   */
  async storeAccessTokenResponse(
    storingAccessTokenResponse: StoredAccessTokenResponse,
  ): Promise<DeepReadonly<StoredAccessTokenResponse>> {
    return await this.storage.storeItem(
      tokenDataKeyName,
      storingAccessTokenResponse,
    );
  }

  /**
   * Remove stored access token response.
   *
   * @returns The `Promise` of `void`
   */
  async removeAccessTokenResponse(): Promise<void> {
    await this.storage.removeItem(tokenDataKeyName);
  }

  /**
   * Watch the changing of stored access token response. It returns the
   * _multicast observable_ for observing value of the given `key`. Emitting
   * `null` value means the value was removed.
   *
   * @returns The `Observable` of immuable stored access token response
   */
  watchAccessTokenResponse(): Observable<
    DeepReadonly<StoredAccessTokenResponse | null>
  > {
    return this.accessTokenResponse$;
  }
}

/** Access token storage factory creates storage for specific storage name */
@Injectable({
  providedIn: 'root',
})
export class AccessTokenStorageFactory {
  private readonly storageFactory = inject(KEY_VALUE_PAIR_STORAGE_FACTORY);
  private readonly existingNameSet = new Set<string>();

  /**
   * Create storage from `name`. The `name` **MUST** be unique.
   *
   * @param name The name of storage
   * @returns The storage
   */
  create(name: string): AccessTokenStorage {
    if (this.existingNameSet.has(name)) {
      throw new Error(`Duplicated name '${name}' in access-token.storage.`);
    }

    this.existingNameSet.add(name);

    return new AccessTokenStorage(this.storageFactory.get(name));
  }
}
