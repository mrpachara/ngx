import {
  isJwkEcdsa,
  JwkBase,
  SignedJsonWebInfo,
  SignedJsonWebVerifier,
} from '@mrpachara/ngx-oauth2-access-token';
import { toJsonWebKey } from './helpers';

export default (async (
  signedJsonWebInfo: SignedJsonWebInfo,
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
          signedJsonWebInfo.signature,
          encoder.encode(signedJsonWebInfo.content),
        );
      } catch (err) {
        console.warn(err);

        return undefined;
      }
    }
  }

  return undefined;
}) as SignedJsonWebVerifier;
