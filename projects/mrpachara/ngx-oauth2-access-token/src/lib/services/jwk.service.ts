import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import {
  MatchedJwkNotFoundError,
  SupportedJwkAlgNotFoundError,
} from '../errors';
import { findJwk } from '../helpers';
import {
  JWK_CONFIG,
  JWT_VERIFIERS,
  SKIP_ASSIGNING_ACCESS_TOKEN,
} from '../tokens';
import { JwkConfig, JwkSet, JwsInfo, JwtInfo, PickOptional } from '../types';

/** Default JWK configuration */
const defaultJwkConfig: PickOptional<JwkConfig> = {} as const;

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
export class JwkService {
  private readonly config = configure(inject(JWK_CONFIG));

  private readonly http = inject(HttpClient);

  /** The issuer for the service */
  get issuer() {
    return this.config.issuer;
  }

  private readonly verifiers = inject(JWT_VERIFIERS);

  private fetchJwkSet(): Observable<JwkSet> {
    return this.http.get<JwkSet>(this.config.jwkSetUrl, {
      context: new HttpContext().set(SKIP_ASSIGNING_ACCESS_TOKEN, true),
    });
  }

  /**
   * Verify the given JWT over JWS information.
   *
   * @param jwtOverJwsInfo The JWT over JWS information
   * @returns The `Promise` of `boolean`. It will be `true` for approved and
   *   `false` for refuted
   * @throws `MatchedJwkNotFoundError` when matched JWKs from the loaded JWK Set
   *   are not found
   * @throws `SupportedJwkAlgNotFoundError` when supported algorithm is not
   *   found
   */
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
