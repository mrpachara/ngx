import { Jwk } from './bases/jwk.base';

/** JWK Set */
export interface JwkSet {
  /**
   * The value of the `"keys"` parameter is an array of JWK values. By default,
   * the order of the JWK values within the array does not imply an order of
   * preference among them, although applications of JWK Sets can choose to
   * assign a meaning to the order for their purposes, if desired.
   */
  readonly keys: readonly Jwk[];
}
