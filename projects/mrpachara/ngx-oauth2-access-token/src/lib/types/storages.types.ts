import { Observable } from 'rxjs';

import { AccessToken } from './standard.types';
import { StateAction } from './state-action.types';

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

export type StateData = StateAction & {
  [prop: string]: string;
};

export interface KeyValuePairStorage {
  loadItem<T = unknown>(key: string): Promise<T | null>;
  storeItem<T = unknown>(key: string, value: T): Promise<T>;
  removeItem<T = unknown>(key: string): Promise<T | null>;
  watchItem<T = unknown>(key: string): Observable<T | null>;
  keys(): Promise<string[]>;
}
