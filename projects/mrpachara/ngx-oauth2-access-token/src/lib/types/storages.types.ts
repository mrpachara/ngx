import { Observable } from 'rxjs';

import { AccessTokenResponse, JwtTokenType } from './standard.types';

export type StoredAccessTokenResponse = Omit<
  AccessTokenResponse,
  'expires_in' | 'refresh_token'
> & {
  expires_at: number;
};

export type StoredRefreshToken = {
  refresh_token: string;
  expires_at: number;
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
  watchItem<T = unknown>(key: string): Observable<T | null>;
  keys(): Promise<string[]>;
}
