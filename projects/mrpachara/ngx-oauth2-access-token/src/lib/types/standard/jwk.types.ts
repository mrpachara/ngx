/**
 * A JSON Web Key (JWK) is a JavaScript Object Notation (JSON)
 * [[RFC7159](https://www.rfc-editor.org/rfc/rfc7159.html)] data structure that
 * represents a cryptographic key.
 *
 * The X.509 parts are **not** included in this type.
 */
export interface JwkBase {
  /** Key type represents the format of JWK */
  kty: string;

  /** Key ID */
  kid?: string;

  /** Algorithm */
  alg?: string;

  /** Used of key */
  use?: 'sig' | 'enc';
}

/** Symmetric Key */
export interface JwkSymmetricKeyBase extends JwkBase {
  kty: 'oct';
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
  n: string;
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
  crv: string;
  x: string;
}

/** ECDSA - Elliptic Curve Digital Signature Algorithm */
export interface JwkEcdsa<
  P extends '256' | '384' | '512' = '256' | '384' | '512',
> extends JwkEcBase {
  alg?: `ES${P}`;
  crv: `P-${P}`;
  y: string;
}

/** OKP Key - Octet Key Pair */
export interface JwkOkpBase extends JwkAsymmetricKeyBase {
  kty: 'OKP';
  crv: string;
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
  keys: JwkBase[];
}
