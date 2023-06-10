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

export function findJwk(
  jwtHeader: JwtHeader,
  jwks: JwkBase[],
): JwkBase | undefined {
  const results = jwks
    .filter(
      (jwk) =>
        typeof jwtHeader.kid === 'undefined' || jwtHeader.kid === jwk.kid,
    )
    .filter(
      (jwk) =>
        typeof jwtHeader.alg === 'undefined' || jwtHeader.alg === jwk.alg,
    );

  return results[0];
}

export function isJwkSymmetricKey(jwk: JwkBase): jwk is JwkSymmetricKeyBase {
  return jwk.kty === 'oct';
}

export function isJwkHmac(jwk: JwkBase): jwk is JwkHmac {
  return (
    isJwkSymmetricKey(jwk) &&
    (jwk.alg === 'HS256' || jwk.alg === 'HS384' || jwk.alg === 'HS512')
  );
}

export function isJwkRsaKey(jwk: JwkBase): jwk is JwkRsaBase {
  return jwk.kty === 'RSA';
}

export function isJwkRsassa(jwk: JwkBase): jwk is JwkRsassa {
  return (
    isJwkRsaKey(jwk) &&
    (jwk.alg === 'RS256' || jwk.alg === 'RS384' || jwk.alg === 'RS512')
  );
}

export function isJwkEcKey(jwk: JwkBase): jwk is JwkEcBase {
  return jwk.kty === 'EC';
}

export function isJwkEcdsa(jwk: JwkBase): jwk is JwkEcdsa {
  return (
    isJwkEcKey(jwk) &&
    (jwk.crv === 'P-256' || jwk.crv === 'P-384' || jwk.crv === 'P-512')
  );
}

export function isJwkOkpKey(jwk: JwkBase): jwk is JwkOkpBase {
  return jwk.kty === 'OKP';
}

export function isJwkEddsa(jwk: JwkBase): jwk is JwkEddsa {
  return isJwkOkpKey(jwk) && (jwk.crv === 'Ed25519' || jwk.crv === 'Ed448');
}
