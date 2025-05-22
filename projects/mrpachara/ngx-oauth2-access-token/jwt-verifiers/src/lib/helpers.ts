import { JwkBase } from '@mrpachara/ngx-oauth2-access-token';

export function toJsonWebKey<JWK extends JwkBase>(jwk: JWK): JsonWebKey {
  return {
    ...jwk,
    ...(jwk.key_ops
      ? {
          key_ops: [...jwk.key_ops],
        }
      : {}),
  };
}
