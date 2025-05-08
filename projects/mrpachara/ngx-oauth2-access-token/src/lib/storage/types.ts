import { AccessTokenResponse } from '../types';

/** Stored access token response */
export interface StoredAccessTokenResponse<
  T extends AccessTokenResponse = AccessTokenResponse,
> {
  /** The time that token was created (unix timestamp) */
  createdAt: number;

  /** The time that token will expire (unix timestamp) */
  expiresAt: number;

  /** The access token response */
  response: T;
}

export interface StoredData<T> {
  /** The time that token will expire (unix timestamp) */
  readonly expiresAt: number;

  readonly data: T;
}

/** Stored access token */
export type StoredAccessToken = StoredData<AccessTokenResponse>;

/** Stored access token */
export type StoredRefreshToken = StoredData<string>;
