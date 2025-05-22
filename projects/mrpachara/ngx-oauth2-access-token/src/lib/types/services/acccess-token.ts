import { Uuid } from '../commons';

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

export type FetchNewAccessToken = (signal: AbortSignal) => Promise<void>;
