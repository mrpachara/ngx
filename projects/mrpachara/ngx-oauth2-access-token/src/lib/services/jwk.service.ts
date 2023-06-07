import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

import {
  MatchedJwkNotFoundError,
  SignatureNotFoundError,
  SupportedJwkAlgNotFoundError,
} from '../errors';
import { findJwk, isProvidedSignature } from '../functions';
import { JWT_VERIFIERS } from '../tokens';
import { JwkFullConfig, JwkSet, JwtInfo } from '../types';

export class JwkService {
  private http = inject(HttpClient);
  private verifiers = inject(JWT_VERIFIERS);

  get name() {
    return this.config.name;
  }

  get issuer() {
    return this.config.issuer;
  }

  constructor(private readonly config: JwkFullConfig) {}

  private fetchJwkSet(): Observable<JwkSet> {
    return this.http.get<JwkSet>(this.config.jwkSetUrl);
  }

  async verify(jwtInfo: JwtInfo): Promise<boolean> {
    if (!isProvidedSignature(jwtInfo)) {
      throw new SignatureNotFoundError(jwtInfo.token, jwtInfo);
    }

    const jwkSet = await firstValueFrom(this.fetchJwkSet());
    const jwk = findJwk(jwtInfo.header, jwkSet.keys);

    if (typeof jwk === 'undefined') {
      throw new MatchedJwkNotFoundError(jwtInfo.header);
    }

    for (const verifier of this.verifiers) {
      const result = await verifier.verify(jwtInfo, jwk);

      if (typeof result === 'undefined') {
        continue;
      }

      return result;
    }

    throw new SupportedJwkAlgNotFoundError(jwk);
  }
}
