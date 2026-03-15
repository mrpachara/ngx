import { AccessTokenResponse } from '@mrpachara/ngx-oauth2-access-token/standard';
import { IdKey } from '../../tokens';

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

export const storedData = Symbol('stored-data');
export const removedData = Symbol('removed-data');

export interface AccessTokenResponseUpdatedData<
  T extends AccessTokenResponse = AccessTokenResponse,
> {
  readonly timestamp: number;
  readonly accessTokenResponse: T | typeof storedData | typeof removedData;
}

export interface AccessTokenResponseExtractor<
  T extends AccessTokenResponse = AccessTokenResponse,
> {
  update(
    id: IdKey,
    updatedData: AccessTokenResponseUpdatedData<T>,
  ): Promise<void>;
}
