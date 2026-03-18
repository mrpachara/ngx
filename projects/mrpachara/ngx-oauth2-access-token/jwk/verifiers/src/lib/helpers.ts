import { Jwk } from '@mrpachara/ngx-oauth2-access-token/standard';

export function toJsonWebKey(jwk: Jwk): JsonWebKey {
  return jwk as JsonWebKey;
}
