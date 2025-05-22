import {
  isJwkRsassa,
  JwkBase,
  JwtInfo,
  JwtVerifier,
  Provided,
} from '@mrpachara/ngx-oauth2-access-token';
import { toJsonWebKey } from './helpers';

export default (async (
  jwtInfo: Provided<JwtInfo, 'signature'>,
  jwks: JwkBase[],
): Promise<boolean | undefined> => {
  for (const jwk of jwks) {
    if (isJwkRsassa(jwk)) {
      try {
        const key = await crypto.subtle.importKey(
          'jwk',
          toJsonWebKey(jwk),
          {
            name: 'RSASSA-PKCS1-v1_5',
            hash: {
              name: `SHA-${jwk.alg.slice(2)}`,
            },
          },
          true,
          ['verify'],
        );
        const encoder = new TextEncoder();

        return await crypto.subtle.verify(
          key.algorithm.name,
          key,
          jwtInfo.signature,
          encoder.encode(jwtInfo.content),
        );
      } catch (err) {
        console.warn(err);

        return undefined;
      }
    }
  }

  return undefined;
}) as JwtVerifier;
