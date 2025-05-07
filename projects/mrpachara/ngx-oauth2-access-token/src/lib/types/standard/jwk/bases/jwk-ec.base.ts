import { JwkAsymmetricKeyBase } from './jwk-asymmetric-key.base';

/** EC Key - Elliptic Curve Key */
export interface JwkEcBase extends JwkAsymmetricKeyBase {
  readonly kty: 'EC';

  /**
   * The `"crv"` (curve) parameter identifies the cryptographic curve used with
   * the key.
   */
  readonly crv: string;

  /**
   * The `"x"` (x coordinate) parameter contains the x coordinate for the
   * Elliptic Curve point. It is represented as the base64url encoding of the
   * octet string representation of the coordinate, as defined in Section 2.3.5
   * of [SEC1](https://www.secg.org/sec1-v2.pdf). The length of this octet
   * string **MUST** be the full size of a coordinate for the curve specified in
   * the `"crv"` parameter. For example, if the value of `"crv"` is `"P-521"`,
   * the octet string must be `66` octets long.
   */
  readonly x: string;
}
