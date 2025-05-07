import { JwkAsymmetricKeyBase } from './jwk-asymmetric-key.base';

/** OKP Key - Octet Key Pair */
export interface JwkOkpBase extends JwkAsymmetricKeyBase {
  readonly kty: 'OKP';

  /**
   * The parameter `"crv"` **MUST** be present and contain the subtype of the
   * key (from the "JSON Web Elliptic Curve" registry).
   */
  readonly crv: string;

  /**
   * The parameter `"x"` **MUST** be present and contain the public key encoded
   * using the base64url [[RFC4648](https://www.rfc-editor.org/rfc/rfc4648)]
   * encoding.
   */
  readonly x: string;
}
