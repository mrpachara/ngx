import {
  isJwkEddsa,
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
    if (isJwkEddsa(jwk)) {
      try {
        const key = await crypto.subtle.importKey(
          'jwk',
          toJsonWebKey(jwk),
          {
            name: jwk.crv,
          },
          true,
          ['verify'],
        );
        const encoder = new TextEncoder();

        return await crypto.subtle.verify(
          {
            name: key.algorithm.name,
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
