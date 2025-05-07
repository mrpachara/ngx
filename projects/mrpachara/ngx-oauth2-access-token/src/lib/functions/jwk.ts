import {
  JwkBase,
  JwkEcBase,
  JwkEcdsa,
  JwkEddsa,
  JwkHmac,
  JwkOkpBase,
  JwkRsaBase,
  JwkRsassa,
  JwkSymmetricKeyBase,
  JwtHeader,
} from '../types';

/**
 * Find the matched JWKs from JWT header.
 *
 * @param jwtHeader The JWT header
 * @param jwks The array JWKs to be finded
 * @returns The array of possible JWKs
 */
export function findJwk(
  jwtHeader: JwtHeader,
  jwks: readonly JwkBase[],
): JwkBase[] {
  return jwks
    .filter(
      (jwk) =>
        typeof jwtHeader.kid === 'undefined' || jwtHeader.kid === jwk.kid,
    )
    .filter(
      (jwk) =>
        typeof jwtHeader.alg === 'undefined' || jwtHeader.alg === jwk.alg,
    );
}

/**
 * Type guard for JWK symmetric key.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkSymmetricKeyBase`
 */
export function isJwkSymmetricKey(jwk: JwkBase): jwk is JwkSymmetricKeyBase {
  return jwk.kty === 'oct';
}

/**
 * Type guard for JWK HMAC Algorithm.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkHmac`
 */
export function isJwkHmac(jwk: JwkBase): jwk is JwkHmac {
  return (
    isJwkSymmetricKey(jwk) &&
    (jwk.alg === 'HS256' || jwk.alg === 'HS384' || jwk.alg === 'HS512')
  );
}

/**
 * Type guard for JWK RSA key.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkRsaBase`
 */
export function isJwkRsaKey(jwk: JwkBase): jwk is JwkRsaBase {
  return jwk.kty === 'RSA';
}

/**
 * Type guard for JWK RSASSA Algorithm.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkRsassa`
 */
export function isJwkRsassa(jwk: JwkBase): jwk is JwkRsassa {
  return (
    isJwkRsaKey(jwk) &&
    (jwk.alg === 'RS256' || jwk.alg === 'RS384' || jwk.alg === 'RS512')
  );
}

/**
 * Type guard for JWK EC key.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkEcBase`
 */
export function isJwkEcKey(jwk: JwkBase): jwk is JwkEcBase {
  return jwk.kty === 'EC';
}

/**
 * Type guard for JWK ECDSA Algorithm.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkEcdsa`
 */
export function isJwkEcdsa(jwk: JwkBase): jwk is JwkEcdsa {
  return (
    isJwkEcKey(jwk) &&
    (jwk.crv === 'P-256' || jwk.crv === 'P-384' || jwk.crv === 'P-512')
  );
}

/**
 * Type guard for JWK OKP key.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkOkpBase`
 */
export function isJwkOkpKey(jwk: JwkBase): jwk is JwkOkpBase {
  return jwk.kty === 'OKP';
}

/**
 * Type guard for JWK EdDSA Algorithm.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkEddsa`
 */
export function isJwkEddsa(jwk: JwkBase): jwk is JwkEddsa {
  return isJwkOkpKey(jwk) && (jwk.crv === 'Ed25519' || jwk.crv === 'Ed448');
}
