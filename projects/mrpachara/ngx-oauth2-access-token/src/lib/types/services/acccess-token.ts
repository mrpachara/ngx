import { Uuid } from '../commons';
import { AccessTokenResponse } from '../standards';

interface AccessTokenMessageType<T extends string> {
  readonly type: T;
  readonly timestamp: number;
  readonly from: Uuid;
  readonly to?: Uuid;
}

export interface AccessTokenMessage
  extends AccessTokenMessageType<'external-storing'> {
  readonly ready: boolean;
}

/** Access token information */
export interface AccessTokenInfo {
  /** The type for using access token */
  readonly type: string;

  /** The access token */
  readonly token: string;
}

export interface AccessTokenNotificationData {
  readonly id: symbol;
  readonly accessTokenResponse: AccessTokenResponse | null;
}
