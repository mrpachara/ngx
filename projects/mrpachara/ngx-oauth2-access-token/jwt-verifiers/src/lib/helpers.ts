import { Jwk } from '@mrpachara/ngx-oauth2-access-token';

export function toJsonWebKey(jwk: Jwk): JsonWebKey {
  const { key_ops, ...rest } = jwk;
  return {
    ...rest,
    ...(key_ops
      ? {
          key_ops: [...key_ops],
        }
      : {}),
  };
}
