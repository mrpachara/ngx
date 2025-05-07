import { JwkSymmetricKeyBase } from './jwk-symmetric-key.base';

/** Hash-based Algorithm */
export interface JwkHashBase extends JwkSymmetricKeyBase {
  readonly alg?: `H${string}`;
}
