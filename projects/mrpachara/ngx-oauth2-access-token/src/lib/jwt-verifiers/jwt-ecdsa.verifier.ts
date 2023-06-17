import { Injectable, isDevMode } from '@angular/core';

import { JwkBase, JwtInfo, JwtVerifier, Provided } from '../types';
import { isJwkEcdsa } from '../functions/jwk.functions';

/** ECDSA verifier */
@Injectable({
  providedIn: 'root',
})
export class JwtEcdsaVerifier implements JwtVerifier {
  async verify(
    jwtInfo: Provided<JwtInfo, 'signature'>,
    jwks: JwkBase[],
  ): Promise<boolean | undefined> {
    for (const jwk of jwks) {
      if (isJwkEcdsa(jwk)) {
        try {
          const key = await crypto.subtle.importKey(
            'jwk',
            jwk,
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
