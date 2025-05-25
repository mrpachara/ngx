import {
  Jwk,
  JwkEc,
  JwkEcdsa,
  JwkEddsa,
  JwkHmac,
  JwkOkp,
  JwkRsa,
  JwkRsassa,
  JwkSymmetricKey,
  JwtHeader,
} from '../types';

/**
 * Find the matched JWKs from JWT header.
 *
 * @param jwtHeader The JWT header
 * @param jwks The array JWKs to be finded
 * @returns The array of possible JWKs
 */
export function findJwk(jwtHeader: JwtHeader, jwks: readonly Jwk[]): Jwk[] {
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
 * @returns `true` when `jwk` is `JwkSymmetricKey`
 */
export function isJwkSymmetricKey(jwk: Jwk): jwk is JwkSymmetricKey {
  return jwk.kty === 'oct';
}

/**
 * Type guard for JWK HMAC Algorithm.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkHmac`
 */
export function isJwkHmac(jwk: Jwk): jwk is JwkHmac {
  return (
    isJwkSymmetricKey(jwk) &&
    (jwk.alg === 'HS256' || jwk.alg === 'HS384' || jwk.alg === 'HS512')
  );
}

/**
 * Type guard for JWK RSA key.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkRsa`
 */
export function isJwkRsaKey(jwk: Jwk): jwk is JwkRsa {
  return jwk.kty === 'RSA';
}

/**
 * Type guard for JWK RSASSA Algorithm.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkRsassa`
 */
export function isJwkRsassa(jwk: Jwk): jwk is JwkRsassa {
  return (
    isJwkRsaKey(jwk) &&
    (jwk.alg === 'RS256' || jwk.alg === 'RS384' || jwk.alg === 'RS512')
  );
}

/**
 * Type guard for JWK EC key.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkEc`
 */
export function isJwkEcKey(jwk: Jwk): jwk is JwkEc {
  return jwk.kty === 'EC';
}

/**
 * Type guard for JWK ECDSA Algorithm.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkEcdsa`
 */
export function isJwkEcdsa(jwk: Jwk): jwk is JwkEcdsa {
  return (
    isJwkEcKey(jwk) &&
    (jwk.crv === 'P-256' || jwk.crv === 'P-384' || jwk.crv === 'P-512')
  );
}

/**
 * Type guard for JWK OKP key.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkOkp`
 */
export function isJwkOkpKey(jwk: Jwk): jwk is JwkOkp {
  return jwk.kty === 'OKP';
}

/**
 * Type guard for JWK EdDSA Algorithm.
 *
 * @param jwk The given JWK
 * @returns `true` when `jwk` is `JwkEddsa`
 */
export function isJwkEddsa(jwk: Jwk): jwk is JwkEddsa {
  return isJwkOkpKey(jwk) && (jwk.crv === 'Ed25519' || jwk.crv === 'Ed448');
}
