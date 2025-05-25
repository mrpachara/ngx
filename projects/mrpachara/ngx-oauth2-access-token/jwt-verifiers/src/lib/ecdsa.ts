import {
  isJwkEcdsa,
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
    if (isJwkEcdsa(jwk)) {
      try {
        const key = await crypto.subtle.importKey(
          'jwk',
          toJsonWebKey(jwk),
          {
            name: 'ECDSA',
            namedCurve: jwk.crv,
          },
          true,
          ['verify'],
        );

        const hash = `SHA-${jwk.crv.slice(2)}`;

        return await crypto.subtle.verify(
          {
            name: key.algorithm.name,
            hash: {
              name: hash,
            },
          },
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
