import { Injectable } from '@angular/core';

import { JwkBase, JwtInfo, JwtVerifier, Provided } from '../types';
import { isJwkRsassa } from '../functions/jwk.functions';

@Injectable({
  providedIn: 'root',
})
export class JwtRsassaVerifier implements JwtVerifier {
  async verify(
    jwtInfo: Provided<JwtInfo, 'signature'>,
    jwk: JwkBase,
  ): Promise<boolean | undefined> {
    if (isJwkRsassa(jwk)) {
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
    }

    return undefined;
  }
}