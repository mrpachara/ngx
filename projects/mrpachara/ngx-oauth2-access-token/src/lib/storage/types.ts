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

/** Stored access token response */
export interface StoredRefreshToken {
  /** The time that token will expire (unix timestamp) */
  expiresAt: number;

  /** The refresh token */
  token: string;
}
