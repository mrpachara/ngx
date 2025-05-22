import { inject, Injectable } from '@angular/core';
import { StateExpiredError, StateNotFoundError } from '../errors';
import {
  assignRequestData,
  base64UrlEncode,
  randomString,
  sha256,
  validateAndTransformScopes,
} from '../helpers';
import {
  AUTHORIZATION_CODE_CONFIG,
  AUTHORIZATION_CODE_STORAGE,
} from '../tokens';
import {
  AdditionalParams,
  AuthorizationCodeConfigWithId,
  AuthorizationCodeRequest,
  PickOptionalExcept,
  Scopes,
  WithoutCodeChallengeRequest,
} from '../types';
import { AccessTokenService } from './access-token.service';

/** Default authorization code configuration */
const defaultAuthorizationCodeConfig: PickOptionalExcept<
  AuthorizationCodeConfigWithId,
  'pkce'
> = {
  stateLength: 32,
  stateTtl: 600_000,
  codeVerifierLength: 56,
} as const;

const existingNameSet = new Set<string>();

function configure(config: AuthorizationCodeConfigWithId) {
  if (typeof config.id.description === 'undefined') {
    throw new Error(`authorization-code service id MUST has description`);
  }

  if (existingNameSet.has(config.id.description)) {
    throw new Error(
      `Non-unique authorization-code service id description '${config.id.description}'`,
    );
  }

  existingNameSet.add(config.id.description);

  return {
    ...defaultAuthorizationCodeConfig,
    ...config,
  } as const;
}

@Injectable()
export class AuthorizationCodeService {
  private readonly config = configure(inject(AUTHORIZATION_CODE_CONFIG));

  private readonly accessTokenService = inject(AccessTokenService);

  private readonly storage = inject(AUTHORIZATION_CODE_STORAGE);

  get id() {
    return this.config.id;
  }

  get name() {
    return this.config.id.description!;
  }

  readonly #init$: Promise<void>;

  constructor() {
    this.#init$ = this.storage.removeExpired();
  }

  /**
   * Generate authorization code url.
   *
   * @param scopes The requesting scopes
   * @param stateData The state data wanted to be stored for requesting
   * @param params The additional parameters for requesting.
   * @returns The `Promise` of authorization code requesting `URL`
   * @throws InvalidScopeError
   */
  async generateUrl<T>(
    scopes: Scopes,
    stateData: T,
    { params = {} as AdditionalParams } = {},
  ): Promise<URL> {
    await this.#init$;

    const state = randomString(this.config.stateLength);

    const scope = validateAndTransformScopes(scopes);

    const {
      codeChallengeMethod = undefined,
      codeVerifier = undefined,
      codeChallenge = undefined,
    } = typeof this.config.pkce === 'undefined'
      ? {}
      : await (async () => {
          const codeChallengeMethod = this.config.pkce;
          const codeVerifier = randomString(this.config.codeVerifierLength);
          const codeChallenge =
            codeChallengeMethod === 'plain'
              ? codeVerifier
              : base64UrlEncode(await sha256(codeVerifier));

          return { codeChallengeMethod, codeVerifier, codeChallenge };
        })();

    const authorizationCodeRequest: AuthorizationCodeRequest = {
      response_type: 'code',
      client_id: this.accessTokenService.clientId,
      redirect_uri: this.config.redirectUri,
      scope,
      state,
      ...(typeof codeChallenge === 'undefined'
        ? ({} as WithoutCodeChallengeRequest)
        : {
            ...(typeof codeChallengeMethod === 'undefined'
              ? {}
              : { code_challenge_method: codeChallengeMethod }),
            code_challenge: codeChallenge,
          }),
    } as const;

    const url = new URL(this.config.authorizationCodeUrl);

    assignRequestData(url.searchParams, authorizationCodeRequest, { params });

    await this.storage.store<T>(state, {
      expiresAt: Date.now() + this.config.stateTtl,
      ...(typeof codeVerifier === 'undefined' ? {} : { codeVerifier }),
      data: stateData,
    });

    return url;
  }

  /**
   * Exchange _authorization code_ for the new _access token_. Use fetch from
   * `AccessTokenService` that stores the new _access token_.
   *
   * @param state The state for exchanging
   * @param code The authorization code to be exchanged
   * @param params The additional parameters for requesting.
   * @returns The `Promise` of state data
   * @throws StateNotFoundError | StateExpiredError
   */
  async exchangeCode<T>(
    state: string,
    code: string,
    { params = undefined as AdditionalParams | undefined } = {},
  ): Promise<T> {
    await this.#init$;

    const storedStateData = await this.storage.remove<T>(state);

    if (typeof storedStateData === 'undefined') {
      throw new StateNotFoundError();
    }

    if (storedStateData.expiresAt <= Date.now()) {
      throw new StateExpiredError();
    }

    const { codeVerifier } = storedStateData;

    await this.accessTokenService.fetch(
      'authorization_code',
      code,
      this.config.redirectUri,
      {
        codeVerifier,
        params,
      },
    );

    return storedStateData.data;
  }

  /**
   * Load and clear state data.
   *
   * @param state The state to be cleared
   * @returns The `Promise` of state data or `undefined` when not found or
   *   expired
   */
  async clearState<T>(state: string): Promise<T | undefined> {
    await this.#init$;

    const storedStateData = await this.storage.remove<T>(state);

    if (
      typeof storedStateData === 'undefined' ||
      storedStateData.expiresAt <= Date.now()
    ) {
      return undefined;
    }

    return storedStateData.data;
  }
}
