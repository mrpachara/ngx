import { Injectable } from '@angular/core';

import { JwkBase, JwtInfo, JwtVerifier, Provided } from '../types';
import { isJwkEcdsa } from '../functions/jwk.functions';

@Injectable({
  providedIn: 'root',
})
export class JwtEcdsaVerifier implements JwtVerifier {
  async verify(
    jwtInfo: Provided<JwtInfo, 'signature'>,
    jwk: JwkBase,
  ): Promise<boolean | undefined> {
    if (isJwkEcdsa(jwk)) {
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
    }

    return undefined;
  }
}
