import {
  isJwkHmac,
  Jwk,
  JwsInfo,
  JwtInfo,
  JwtVerifier,
} from '@mrpachara/ngx-oauth2-access-token';
import { toJsonWebKey } from './helpers';

export default (async (
  jwtOverJwsInfo: Extract<JwtInfo, JwsInfo>,
  jwks: Jwk[],
): Promise<boolean | undefined> => {
  for (const jwk of jwks) {
    if (isJwkHmac(jwk)) {
      try {
        const key = await crypto.subtle.importKey(
          'jwk',
          toJsonWebKey(jwk),
          {
            name: 'HMAC',
            hash: {
              name: `SHA-${jwk.alg.slice(2)}`,
            },
          },
          true,
          ['verify'],
        );

        return await crypto.subtle.verify(
          key.algorithm.name,
          key,
          jwtOverJwsInfo.signature,
          jwtOverJwsInfo.protectedContent,
        );
      } catch (err) {
        console.warn(err);

        return undefined;
      }
    }
  }

  return undefined;
}) as JwtVerifier;
