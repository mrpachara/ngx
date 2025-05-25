import { JwkSymmetricKey } from './jwk-symmetric-key.base';

/** Hash-based Algorithm */
export interface JwkHash extends JwkSymmetricKey {
  readonly alg?: `H${string}`;
}
