import { Injectable } from '@angular/core';

import { JwkBase, JwtInfo, JwtVerifier, Provided } from '../types';
import { isJwkHmac } from '../functions';

@Injectable({
  providedIn: 'root',
})
export class JwtHmacVerifier implements JwtVerifier {
  async verify(
    jwtInfo: Provided<JwtInfo, 'signature'>,
    jwk: JwkBase,
  ): Promise<boolean | undefined> {
    if (isJwkHmac(jwk)) {
      const key = await crypto.subtle.importKey(
        'jwk',
        jwk,
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
        jwtInfo.signature,
        encoder.encode(jwtInfo.content),
      );
    }

    return undefined;
  }
}