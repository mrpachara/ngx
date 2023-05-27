import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AccessTokenExpiredError,
  AccessTokenNotFoundError,
  RefreshTokenExpiredError,
  RefreshTokenNotFoundError,
} from '../errors';
import { frameworkPrefix } from '../predefined';
import {
  KeyValuePairStorage,
  StoredAccessTokenResponse,
  StoredRefreshToken,
} from '../types';
import { KEY_VALUE_PAIR_STORAGE } from '../tokens';

const tokenDataKeyName = `access-token-data`;

export class AccessTokenStorage {
  private stoageKey = (type: 'access-token' | 'refresh-token') =>
    `${frameworkPrefix}-${this.name}-${tokenDataKeyName}-${type}` as const;

  private readonly accessToken$: Observable<StoredAccessTokenResponse | null>;

  constructor(
    private readonly name: string,
    private readonly storage: KeyValuePairStorage,
  ) {
    this.accessToken$ = this.storage.watchItem<StoredAccessTokenResponse>(
      this.stoageKey('access-token'),
    );
  }

  async loadAccessTokenResponse(): Promise<StoredAccessTokenResponse> {
    const storedAccessTokenResponse =
      await this.storage.loadItem<StoredAccessTokenResponse>(
        this.stoageKey('access-token'),
      );

    if (storedAccessTokenResponse === null) {
      throw new AccessTokenNotFoundError(this.name);
    }

    if (storedAccessTokenResponse.expires_at < Date.now()) {
      throw new AccessTokenExpiredError(this.name);
    }

    return storedAccessTokenResponse;
  }

  async storeAccessTokenResponse(
    storedAccessTokenResponse: StoredAccessTokenResponse,
  ): Promise<StoredAccessTokenResponse> {
    return await this.storage.storeItem(
      this.stoageKey('access-token'),
      storedAccessTokenResponse,
    );
  }

  async removeAccessTokenResponse(): Promise<void> {
    await this.storage.removeItem(this.stoageKey('access-token'));
  }

  async loadRefreshToken(): Promise<StoredRefreshToken> {
    const storedRefreshToken = await this.storage.loadItem<StoredRefreshToken>(
      this.stoageKey('refresh-token'),
    );

    if (storedRefreshToken === null) {
      throw new RefreshTokenNotFoundError(this.name);
    }

    if (storedRefreshToken.expires_at < Date.now()) {
      throw new RefreshTokenExpiredError(this.name);
    }

    return storedRefreshToken;
  }

  async storeRefreshToken(
    refreshToken: StoredRefreshToken,
  ): Promise<StoredRefreshToken> {
    return await this.storage.storeItem(
      this.stoageKey('refresh-token'),
      refreshToken,
    );
  }

  async removeRefreshToken(): Promise<void> {
    await this.storage.removeItem(this.stoageKey('refresh-token'));
  }

  async clearToken(): Promise<void> {
    await this.storage.removeItem(this.stoageKey('access-token'));
    await this.storage.removeItem(this.stoageKey('refresh-token'));
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
