import { Injectable, isDevMode } from '@angular/core';

import { isJwkEddsa } from '../functions';
import { JwkBase, JwtInfo, JwtVerifier, Provided } from '../types';

@Injectable({
  providedIn: 'root',
})
export class JwtEddsaVerifier implements JwtVerifier {
  async verify(
    jwtInfo: Provided<JwtInfo, 'signature'>,
    jwks: JwkBase[],
  ): Promise<boolean | undefined> {
    for (const jwk of jwks) {
      if (isJwkEddsa(jwk)) {
        try {
          const key = await crypto.subtle.importKey(
            'jwk',
            jwk,
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
