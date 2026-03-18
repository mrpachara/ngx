import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { OAT_REQUEST } from '@mrpachara/ngx-oauth2-access-token';
import {
  findJwk,
  JwkSet,
  JwsInfo,
  JwtInfo,
  MatchedJwkNotFoundError,
  SupportedJwkAlgNotFoundError,
} from '@mrpachara/ngx-oauth2-access-token/standard';
import { firstValueFrom, Observable } from 'rxjs';
import { JWK_CONFIG, JWT_VERIFIERS } from '../tokens';
import { JwkConfig, JwkOperations } from '../types';
import { defaultJwkConfig } from './jwk.service.default';

/**
 * Create the full JWK configuration.
 *
 * @param config The configuration
 * @returns The full configuration
 */
function configure(config: JwkConfig) {
  return {
    ...defaultJwkConfig,
    ...config,
  } as const;
}

/** JWK service */
@Injectable()
export class JwkService implements JwkOperations {
  private readonly config = configure(inject(JWK_CONFIG));

  private readonly http = inject(HttpClient);

  get issuer() {
    return this.config.issuer;
  }

  private readonly verifiers = inject(JWT_VERIFIERS);

  private fetchJwkSet(): Observable<JwkSet> {
    return this.http.get<JwkSet>(this.config.jwkSetUrl, {
      context: new HttpContext().set(OAT_REQUEST, true),
    });
  }

  async verify(jwtOverJwsInfo: Extract<JwtInfo, JwsInfo>): Promise<boolean> {
    const jwkSet = await firstValueFrom(this.fetchJwkSet());
    const jwks = findJwk(jwtOverJwsInfo.header, jwkSet.keys);

    if (jwks.length === 0) {
      throw new MatchedJwkNotFoundError(jwtOverJwsInfo);
    }

    for (const verify of this.verifiers) {
      const result = await verify(jwtOverJwsInfo, jwks);

      if (typeof result === 'undefined') {
        continue;
      }

      return result;
    }

    throw new SupportedJwkAlgNotFoundError(jwks);
  }
}
