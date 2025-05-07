import { JwkEcBase } from './bases';

/** ECDSA - Elliptic Curve Digital Signature Algorithm */
export interface JwkEcdsa<
  P extends '256' | '384' | '512' = '256' | '384' | '512',
> extends JwkEcBase {
  readonly alg?: `ES${P}`;
  readonly crv: `P-${P}`;

  /**
   * The `"y"` (y coordinate) parameter contains the y coordinate for the
   * Elliptic Curve point. It is represented as the base64url encoding of the
   * octet string representation of the coordinate, as defined in Section 2.3.5
   * of [SEC1](https://www.secg.org/sec1-v2.pdf). The length of this octet
   * string **MUST** be the full size of a coordinate for the curve specified in
   * the `"crv"` parameter. For example, if the value of `"crv"` is `"P-521"`,
   * the octet string must be `66` octets long.
   */
  readonly y: string;
}
