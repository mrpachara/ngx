import { HttpClient, HttpContext } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import {
  MatchedJwkNotFoundError,
  SignatureNotFoundError,
  SupportedJwkAlgNotFoundError,
} from '../errors';
import { findJwk, isProvidedSignature } from '../functions';
import { JWT_VERIFIERS, SKIP_ASSIGNING_ACCESS_TOKEN } from '../tokens';
import { JwkFullConfig, JwkSet, JwtInfo, JwtVerifier } from '../types';

/** JWK service */
export class JwkService {
  private http = inject(HttpClient);
  private parentVerifiers = inject(JWT_VERIFIERS, {
    skipSelf: true,
    optional: true,
  });
  private scopedVerifiers = inject(JWT_VERIFIERS, {
    self: true,
    optional: true,
  });

  /** The service name */
  get name() {
    return this.config.name;
  }

  /** The issuer for the service */
  get issuer() {
    return this.config.issuer;
  }

  private readonly verifiers: JwtVerifier[];

  constructor(private readonly config: JwkFullConfig) {
    this.verifiers = [
      ...new Set([
        ...(this.scopedVerifiers ?? []),
        ...(this.parentVerifiers ?? []),
      ]),
    ];
  }

  private fetchJwkSet(): Observable<JwkSet> {
    return this.http.get<JwkSet>(this.config.jwkSetUrl, {
      context: new HttpContext().set(SKIP_ASSIGNING_ACCESS_TOKEN, true),
    });
  }

  /**
   * Verify the given JWT information.
   *
   * @param jwtInfo The JWT information
   * @returns The `Promise` of `boolean`. It will be `true` for approved and
   *   `false` for refuted
   * @throws `SignatureNotFoundError` when `jwtInfo` is not provided `signature`
   * @throws `MatchedJwkNotFoundError` when matched JWKs from the loaded JWK Set
   *   are not found
   * @throws `SupportedJwkAlgNotFoundError` when supported algorithm is not
   *   found
   */
  async verify(jwtInfo: JwtInfo): Promise<boolean> {
    if (!isProvidedSignature(jwtInfo)) {
      throw new SignatureNotFoundError(jwtInfo.token, jwtInfo);
    }

    const jwkSet = await firstValueFrom(this.fetchJwkSet());
    const jwks = findJwk(jwtInfo.header, jwkSet.keys);

    if (jwks.length === 0) {
      throw new MatchedJwkNotFoundError(jwtInfo.header);
    }

    for (const verify of this.verifiers) {
      const result = await verify(jwtInfo, jwks);

      if (typeof result === 'undefined') {
        continue;
      }

      return result;
    }

    throw new SupportedJwkAlgNotFoundError(jwks);
  }
}
