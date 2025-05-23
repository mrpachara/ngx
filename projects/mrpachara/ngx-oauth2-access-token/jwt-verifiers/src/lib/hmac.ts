import {
  isJwkHmac,
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
        const encoder = new TextEncoder();

        return await crypto.subtle.verify(
          key.algorithm.name,
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
