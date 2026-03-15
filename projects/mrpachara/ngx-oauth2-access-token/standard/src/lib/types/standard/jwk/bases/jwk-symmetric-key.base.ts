import { Jwk } from './jwk.base';

/** Symmetric Key */
export interface JwkSymmetricKey extends Jwk {
  readonly kty: 'oct';

  /**
   * The `"k"` (key value) parameter contains the value of the symmetric (or
   * other single-valued) key. It is represented as the base64url encoding of
   * the octet sequence containing the key value.
   */
  readonly k: string;
}
