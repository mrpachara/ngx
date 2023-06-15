import { AccessTokenResponse } from '../types';

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
