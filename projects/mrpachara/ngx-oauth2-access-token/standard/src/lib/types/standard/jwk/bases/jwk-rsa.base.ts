import { JwkAsymmetricKey } from './jwk-asymmetric-key.base';

/** RSA Key */
export interface JwkRsa extends JwkAsymmetricKey {
  readonly kty: 'RSA';

  /**
   * The `"n"` (modulus) parameter contains the modulus value for the RSA public
   * key. It is represented as a Base64urlUInt-encoded value.
   */
  readonly n: string;

  /**
   * The `"e"` (exponent) parameter contains the exponent value for the RSA
   * public key. It is represented as a Base64urlUInt-encoded value.
   */
  readonly e: string;
}
