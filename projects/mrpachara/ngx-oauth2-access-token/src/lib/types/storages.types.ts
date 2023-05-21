import { Observable } from 'rxjs';

import { AccessToken } from './standard.types';

export type StoredAccessToken = Omit<
  AccessToken,
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

export interface KeyValuePairStorage {
  loadItem<T = unknown>(key: string): Promise<T | null>;
  storeItem<T = unknown>(key: string, value: T): Promise<T>;
  removeItem<T = unknown>(key: string): Promise<T | null>;
  watchItem<T = unknown>(key: string): Observable<T | null>;
  keys(): Promise<string[]>;
}
