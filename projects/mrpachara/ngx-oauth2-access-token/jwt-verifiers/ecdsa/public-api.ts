import {
  isJwkEcdsa,
  JwkBase,
  JwtInfo,
  JwtVerifier,
  Provided,
} from '@mrpachara/ngx-oauth2-access-token';

import { toJsonWebKey } from '@mrpachara/ngx-oauth2-access-token/jwt-verifiers';

export default (async (
  jwtInfo: Provided<JwtInfo, 'signature'>,
  jwks: JwkBase[],
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
        const encoder = new TextEncoder();
        const hash = `SHA-${jwk.crv.slice(2)}`;

        return await crypto.subtle.verify(
          {
            name: key.algorithm.name,
            hash: {
              name: hash,
            },
          },
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
