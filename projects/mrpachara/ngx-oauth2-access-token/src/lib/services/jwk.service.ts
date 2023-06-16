import { inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

import {
  MatchedJwkNotFoundError,
  SignatureNotFoundError,
  SupportedJwkAlgNotFoundError,
} from '../errors';
import { findJwk, isProvidedSignature } from '../functions';
import {
  DEFAULT_JWT_VERIFIERS,
  JWT_VERIFIERS,
  SKIP_ASSIGNING_ACCESS_TOKEN,
} from '../tokens';
import { JwkFullConfig, JwkSet, JwtInfo, JwtVerifier } from '../types';

export class JwkService {
  private http = inject(HttpClient);
  private defaultVerifiers = inject(DEFAULT_JWT_VERIFIERS);
  private parentVerifiers = inject(JWT_VERIFIERS, {
    skipSelf: true,
    optional: true,
  });
  private scopedVerifiers = inject(JWT_VERIFIERS, {
    self: true,
    optional: true,
  });

  get name() {
    return this.config.name;
  }

  get issuer() {
    return this.config.issuer;
  }

  private readonly verifiers: JwtVerifier[];

  constructor(private readonly config: JwkFullConfig) {
    this.verifiers = [
      ...new Set([
        ...(this.scopedVerifiers ?? []),
        ...(this.parentVerifiers ?? []),
        ...this.defaultVerifiers,
      ]),
    ];
  }

  private fetchJwkSet(): Observable<JwkSet> {
    return this.http.get<JwkSet>(this.config.jwkSetUrl, {
      context: new HttpContext().set(SKIP_ASSIGNING_ACCESS_TOKEN, true),
    });
  }

  async verify(jwtInfo: JwtInfo): Promise<boolean> {
    if (!isProvidedSignature(jwtInfo)) {
      throw new SignatureNotFoundError(jwtInfo.token, jwtInfo);
    }

    const jwkSet = await firstValueFrom(this.fetchJwkSet());
    const jwks = findJwk(jwtInfo.header, jwkSet.keys);

    if (jwks.length === 0) {
      throw new MatchedJwkNotFoundError(jwtInfo.header);
    }

    for (const verifier of this.verifiers) {
      const result = await verifier.verify(jwtInfo, jwks);

      if (typeof result === 'undefined') {
        continue;
      }

      return result;
    }

    throw new SupportedJwkAlgNotFoundError(jwks);
  }
}
