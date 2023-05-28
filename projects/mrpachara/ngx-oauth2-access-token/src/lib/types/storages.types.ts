import { Observable } from 'rxjs';

import { AccessTokenResponse, JwtTokenType } from './standard.types';

export type StoredAccessTokenResponse<
  T extends AccessTokenResponse = AccessTokenResponse,
> = {
  createdAt: number;
  expiresAt: number;
  response: T;
};

export type StoredRefreshToken = {
  expiresAt: number;
  token: string;
};

export type StateData = {
  [prop: string]: string | undefined;
};

export type StoredIdToken = {
  token: JwtTokenType;
};

export interface KeyValuePairStorage {
  loadItem<T = unknown>(key: string): Promise<T | null>;
  storeItem<T = unknown>(key: string, value: T): Promise<T>;
  removeItem<T = unknown>(key: string): Promise<T | null>;

  /**
   * Return a _multicast observable_ for changing value of the given `key`. The
   * `null` value means the key was removed.
   */
  watchItem<T = unknown>(key: string): Observable<T | null>;

  /** Return all keys from the storage. */
  keys(): Promise<string[]>;
}
