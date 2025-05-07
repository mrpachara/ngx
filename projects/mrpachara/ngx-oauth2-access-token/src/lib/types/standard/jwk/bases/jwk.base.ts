import { KeyOpsType } from '../commons';

/**
 * A JSON Web Key (JWK) is a JavaScript Object Notation (JSON)
 * [[RFC7159](https://www.rfc-editor.org/rfc/rfc7159.html)] data structure that
 * represents a cryptographic key.
 *
 * The X.509 parts are **not** included in this type.
 */
export interface JwkBase {
  /**
   * The `"kty"` (key type) parameter identifies the cryptographic algorithm
   * family used with the key, such as `"RSA"` or `"EC"`. `"kty"` values should
   * either be registered in the IANA "JSON Web Key Types" registry established
   * by [[JWA](https://www.rfc-editor.org/rfc/rfc7518.html)] or be a value that
   * contains a Collision- Resistant Name. The `"kty"` value is a case-sensitive
   * string. This member **MUST** be present in a JWK.
   */
  readonly kty: string;

  /**
   * The `"use"` (public key use) parameter identifies the intended use of the
   * public key. The `"use"` parameter is employed to indicate whether a public
   * key is used for encrypting data or verifying the signature on data. The
   * `"use"` value is a case-sensitive string. Use of the `"use"` member is
   * OPTIONAL, unless the application requires its presence.
   */
  readonly use?: 'sig' | 'enc';

  /**
   * The `"key_ops"` (key operations) parameter identifies the operation(s) for
   * which the key is intended to be used. The `"key_ops"` parameter is intended
   * for use cases in which public, private, or symmetric keys may be present.
   *
   * Its value is an array of key operation values. Use of the `"key_ops"`
   * member is OPTIONAL, unless the application requires its presence. The
   * `"use"` and `"key_ops"` JWK members **SHOULD NOT** be used together;
   * however, if both are used, the information they convey **MUST** be
   * consistent. Applications should specify which of these members they use, if
   * either is to be used by the application.
   */
  readonly key_ops?: readonly KeyOpsType[];

  /**
   * The `"alg"` (algorithm) parameter identifies the algorithm intended for use
   * with the key. The values used should either be registered in the IANA "JSON
   * Web Signature and Encryption Algorithms" registry established by
   * [[JWA](https://www.rfc-editor.org/rfc/rfc7518.html)] or be a value that
   * contains a Collision-Resistant Name. The `"alg"` value is a case-sensitive
   * ASCII string. Use of this member is OPTIONAL.
   */
  readonly alg?: string;

  /**
   * The `"kid"` (key ID) parameter is used to match a specific key. This is
   * used, for instance, to choose among a set of keys within a JWK Set during
   * key rollover. The structure of the `"kid"` value is unspecified. When
   * `"kid"` values are used within a JWK Set, different keys within the JWK Set
   * **SHOULD** use distinct `"kid"` values. (One example in which different
   * keys might use the same `"kid"` value is if they have different `"kty"`
   * (key type) values but are considered to be equivalent alternatives by the
   * application using them.) The `"kid"` value is a case-sensitive string. Use
   * of this member is OPTIONAL. When used with JWS or JWE, the `"kid"` value is
   * used to match a JWS or JWE `"kid"` Header Parameter value.
   */
  readonly kid?: string;
}
