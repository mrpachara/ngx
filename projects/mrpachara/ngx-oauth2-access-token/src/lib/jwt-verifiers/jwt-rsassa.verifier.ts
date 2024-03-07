import { Injectable, isDevMode } from '@angular/core';

import { isJwkRsassa } from '../functions/jwk.functions';
import { JwkBase, JwtInfo, JwtVerifier, Provided } from '../types';

/** RSASSA verifier */
@Injectable({
  providedIn: 'root',
})
export class JwtRsassaVerifier implements JwtVerifier {
  async verify(
    jwtInfo: Provided<JwtInfo, 'signature'>,
    jwks: JwkBase[],
  ): Promise<boolean | undefined> {
    for (const jwk of jwks) {
      if (isJwkRsassa(jwk)) {
        try {
          const key = await crypto.subtle.importKey(
            'jwk',
            jwk,
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
          if (isDevMode()) {
            console.warn(err);
          }

          return undefined;
        }
      }
    }

    return undefined;
  }
}
