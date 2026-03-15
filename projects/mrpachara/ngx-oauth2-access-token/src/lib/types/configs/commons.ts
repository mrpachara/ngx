import { IdKey } from '../../tokens';

export interface IdentifiableConfig<N extends string> {
  /** The id of service, it is REQUIRED. */
  readonly id: IdKey<N>;
}
