import { AccessTokenResponse } from '../standards';

interface AccessTokenMessageType<T extends string> {
  readonly type: T;
  readonly timestamp: number;
}

export type AccessTokenMessage = AccessTokenMessageType<'external-store'>;

/** Access token information */
export interface AccessTokenInfo {
  /** The type for using access token */
  readonly type: string;

  /** The access token */
  readonly token: string;
}

export const loadedData = Symbol('loaded-data');
export const removedData = Symbol('removed-data');

export interface AccessTokenResponseUpdatedData<
  T extends AccessTokenResponse = AccessTokenResponse,
> {
  readonly timestamp: number;
  readonly accessTokenResponse: T | typeof removedData | typeof loadedData;
}

export interface AccessTokenResponseExtractor<
  T extends AccessTokenResponse = AccessTokenResponse,
> {
  readonly id: symbol;
  update(updatedData: AccessTokenResponseUpdatedData<T>): Promise<void>;
}
