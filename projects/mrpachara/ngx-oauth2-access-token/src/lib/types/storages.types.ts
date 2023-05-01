import { Observable } from 'rxjs';

import { CreatableFactory } from './lib.types';
import { AccessToken } from './standard.types';
import { StateAction } from './state-action.types';

export type StoredAccessToken = Omit<
  AccessToken,
  'expires_in' | 'refresh_token'
> & {
  expires_at: number;
};

export type StateData = StateAction & {
  [prop: string]: string;
};

export interface AccessTokenStorage {
  loadAccessToken(): Observable<StoredAccessToken>;
  storeAccessToken(
    storedAccessToken: StoredAccessToken,
  ): Observable<StoredAccessToken>;
  removeAccessToken(): Observable<true>;

  loadRefreshToken(): Observable<string>;
  storeRefreshToken(refreshToken: string): Observable<string>;

  clearToken(): Observable<true>;

  watchAccessToken(): Observable<StoredAccessToken | null>;
}

export interface AuthorizationCodeStorage {
  loadStateData(stateId: string): Observable<StateData>;
  storeStateData(stateId: string, stateData: StateData): Observable<StateData>;
  removeStateData(stateId: string): Observable<true>;
}

export type AccessTokenStorageFactory = CreatableFactory<AccessTokenStorage>

export type AuthorizationCodeStorageFactory = CreatableFactory<AuthorizationCodeStorage>
