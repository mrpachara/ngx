export type KeyOpsType =
  | 'sign' // (compute digital signature or MAC)
  | 'verify' // (verify digital signature or MAC)
  | 'encrypt' // (encrypt content)
  | 'decrypt' // (decrypt content and validate decryption, if applicable)
  | 'wrapKey' // (encrypt key)
  | 'unwrapKey' // (decrypt key and validate decryption, if applicable)
  | 'deriveKey' // (derive key)
  | 'deriveBits'; // (derive bits not to be used as a key)

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
  kty: string;

  /**
   * The `"use"` (public key use) parameter identifies the intended use of the
   * public key. The `"use"` parameter is employed to indicate whether a public
   * key is used for encrypting data or verifying the signature on data. The
   * `"use"` value is a case-sensitive string. Use of the `"use"` member is
   * OPTIONAL, unless the application requires its presence.
   */
  use?: 'sig' | 'enc';

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
  key_ops?: KeyOpsType[];

  /**
   * The `"alg"` (algorithm) parameter identifies the algorithm intended for use
   * with the key. The values used should either be registered in the IANA "JSON
   * Web Signature and Encryption Algorithms" registry established by
   * [[JWA](https://www.rfc-editor.org/rfc/rfc7518.html)] or be a value that
   * contains a Collision-Resistant Name. The `"alg"` value is a case-sensitive
   * ASCII string. Use of this member is OPTIONAL.
   */
  alg?: string;

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
  kid?: string;
}

/** Symmetric Key */
export interface JwkSymmetricKeyBase extends JwkBase {
  kty: 'oct';

  /**
   * The `"k"` (key value) parameter contains the value of the symmetric (or
   * other single-valued) key. It is represented as the base64url encoding of
   * the octet sequence containing the key value.
   */
  k: string;
}

/** Hash-based Algorithm */
export interface JwkHashBase extends JwkSymmetricKeyBase {
  alg?: `H${string}`;
}

/** HMAC - Hash-based Message Authentication Codes Algorithm */
export interface JwkHmac<
  SHA extends '256' | '384' | '512' = '256' | '384' | '512',
> extends JwkHashBase {
  alg: `HS${SHA}`;
}

/** Asymmetric Key */
export interface JwkAsymmetricKeyBase extends JwkBase {
  /**
   * Asymatic JWK for _public key_ presentation should **not** present the
   * _private key_ parts. If it does, the encrypted content is considered to be
   * **untrusted**.
   *
   * The implementation **must** check this value to be `undefined`.
   */
  d: never;
}

/** RSA Key */
export interface JwkRsaBase extends JwkAsymmetricKeyBase {
  kty: 'RSA';

  /**
   * The `"n"` (modulus) parameter contains the modulus value for the RSA public
   * key. It is represented as a Base64urlUInt-encoded value.
   */
  n: string;

  /**
   * The `"e"` (exponent) parameter contains the exponent value for the RSA
   * public key. It is represented as a Base64urlUInt-encoded value.
   */
  e: string;
}

/** RSASSA - RSASSA-PKCS1-v1_5 Algorithm */
export interface JwkRsassa<
  SHA extends '256' | '384' | '512' = '256' | '384' | '512',
> extends JwkRsaBase {
  alg: `RS${SHA}`;
}

/** EC Key - Elliptic Curve Key */
export interface JwkEcBase extends JwkAsymmetricKeyBase {
  kty: 'EC';

  /**
   * The `"crv"` (curve) parameter identifies the cryptographic curve used with
   * the key.
   */
  crv: string;

  /**
   * The `"x"` (x coordinate) parameter contains the x coordinate for the
   * Elliptic Curve point. It is represented as the base64url encoding of the
   * octet string representation of the coordinate, as defined in Section 2.3.5
   * of [SEC1](https://www.secg.org/sec1-v2.pdf). The length of this octet
   * string **MUST** be the full size of a coordinate for the curve specified in
   * the `"crv"` parameter. For example, if the value of `"crv"` is `"P-521"`,
   * the octet string must be `66` octets long.
   */
  x: string;
}

/** ECDSA - Elliptic Curve Digital Signature Algorithm */
export interface JwkEcdsa<
  P extends '256' | '384' | '512' = '256' | '384' | '512',
> extends JwkEcBase {
  alg?: `ES${P}`;
  crv: `P-${P}`;

  /**
   * The `"y"` (y coordinate) parameter contains the y coordinate for the
   * Elliptic Curve point. It is represented as the base64url encoding of the
   * octet string representation of the coordinate, as defined in Section 2.3.5
   * of [SEC1](https://www.secg.org/sec1-v2.pdf). The length of this octet
   * string **MUST** be the full size of a coordinate for the curve specified in
   * the `"crv"` parameter. For example, if the value of `"crv"` is `"P-521"`,
   * the octet string must be `66` octets long.
   */
  y: string;
}

/** OKP Key - Octet Key Pair */
export interface JwkOkpBase extends JwkAsymmetricKeyBase {
  kty: 'OKP';

  /**
   * The parameter `"crv"` **MUST** be present and contain the subtype of the
   * key (from the "JSON Web Elliptic Curve" registry).
   */
  crv: string;

  /**
   * The parameter `"x"` **MUST** be present and contain the public key encoded
   * using the base64url [[RFC4648](https://www.rfc-editor.org/rfc/rfc4648)]
   * encoding.
   */
  x: string;
}

/** EdDSA - Edwards-Curve Digital Signature Algorithm */
export interface JwkEddsa<ED extends '25519' | '448' = '25519' | '448'>
  extends JwkOkpBase {
  alg?: 'EdDSA';
  crv: `Ed${ED}`;
}

/** JWK Set */
export interface JwkSet {
  /**
   * The value of the `"keys"` parameter is an array of JWK values. By default,
   * the order of the JWK values within the array does not imply an order of
   * preference among them, although applications of JWK Sets can choose to
   * assign a meaning to the order for their purposes, if desired.
   */
  keys: JwkBase[];
}
