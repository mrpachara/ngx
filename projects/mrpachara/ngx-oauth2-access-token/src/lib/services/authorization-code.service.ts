import { inject } from '@angular/core';
import { defer, from, map, Observable, switchMap } from 'rxjs';

import { InvalidScopeError } from '../errors';
import {
  base64UrlEncode,
  randomString,
  sha256,
  validateAndTransformScopes,
} from '../functions';
import {
  AuthorizationCodeStorage,
  AuthorizationCodeStorageFactory,
} from '../storage';
import {
  AccessTokenResponse,
  AuthorizationCodeFullConfig,
  AuthorizationCodeGrantParams,
  AuthorizationCodeParams,
  CodeChallengeMethod,
  DeepReadonly,
  Scopes,
  StateAuthorizationCode,
  StateData,
} from '../types';
import { Oauth2Client } from './oauth2.client';

const stateIdLength = 32;

type GenUrlParams = Omit<AuthorizationCodeParams, 'state'>;

/** Authorization code service */
export class AuthorizationCodeService {
  private readonly storageFactory = inject(AuthorizationCodeStorageFactory);
  private readonly storage: AuthorizationCodeStorage;

  /** The service name */
  get name() {
    return this.config.name;
  }

  constructor(
    private readonly config: AuthorizationCodeFullConfig,
    private readonly client: Oauth2Client,
  ) {
    this.storage = this.storageFactory.create(
      this.config.name,
      this.config.stateTtl,
    );
  }

  private readonly loadStateData = <
    T extends StateAuthorizationCode = StateAuthorizationCode,
  >(
    stateId: string,
  ) => this.storage.loadStateData<T>(stateId);

  private readonly storeStateData = <
    T extends StateAuthorizationCode = StateAuthorizationCode,
  >(
    stateId: string,
    stateData: T,
  ) => this.storage.storeStateData<T>(stateId, stateData);

  private readonly removeStateData = <
    T extends StateAuthorizationCode = StateAuthorizationCode,
  >(
    stateId: string,
  ) => this.storage.removeStateData<T>(stateId);

  private readonly generateCodeChallenge = async (
    stateData: StateAuthorizationCode,
  ): Promise<
    | {
        code_challenge: string;
        code_challenge_method: CodeChallengeMethod;
      }
    | undefined
  > => {
    if (this.config.pkce === 'none') {
      return undefined;
    }

    const codeVerifier = randomString(this.config.codeVerifierLength);
    const codeChallenge =
      this.config.pkce === 'plain'
        ? codeVerifier
        : base64UrlEncode(await sha256(codeVerifier));
    stateData.codeVerifier = codeVerifier;

    return {
      code_challenge: codeChallenge,
      code_challenge_method: this.config.pkce,
    };
  };

  private readonly generateAuthorizationCodeUrl = async (
    stateId: string,
    stateData: StateAuthorizationCode,
    authorizationCodeParams: GenUrlParams,
  ): Promise<URL> => {
    await this.storeStateData(stateId, stateData);

    const url = new URL(this.config.authorizationCodeUrl);

    Object.entries({
      ...this.config.additionalParams,
      ...authorizationCodeParams,
      state: stateId,
      ...this.client.getClientParams(),
    }).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        url.searchParams.set(key, `${value}`);
      }
    });

    return url;
  };

  /**
   * Fetch authorization code url.
   *
   * @param scopes The requesting scopes
   * @param stateData The state data wanted to be stored for requesting
   * @param additionalParams The additional parameters for requesting. It will
   *   extend the static additional parameters from the counfiguation.
   * @returns The `Promise` of authorization code requesting `URL`
   */
  async fetchAuthorizationCodeUrl<T extends StateData>(
    scopes: Scopes,
    stateData?: T,
    additionalParams?: Record<string, string>,
  ): Promise<URL> {
    const scope = validateAndTransformScopes(scopes);

    if (scope instanceof InvalidScopeError) {
      throw scope;
    }

    const stateId = randomString(stateIdLength);
    const storedStateData: StateAuthorizationCode = {
      ...stateData,
    };

    const params: GenUrlParams = {
      ...additionalParams,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: scope,
      ...(await this.generateCodeChallenge(storedStateData)),
    };

    return this.generateAuthorizationCodeUrl(stateId, storedStateData, params);
  }

  /**
   * Load and clear state data.
   *
   * @param stateId The state ID to be cleared
   * @returns The `Promise` of immubable state data or `null` when not found
   */
  async clearState<T extends StateData = StateData>(
    stateId: string,
  ): Promise<DeepReadonly<(T & StateAuthorizationCode) | null>> {
    return await this.removeStateData<T>(stateId);
  }

  /**
   * Load and verify state data.
   *
   * @param stateId The state ID to be verified
   * @returns The `Observable` of verified state data. Another cases thorw an
   *   error.
   * @throws An error of other cases including refused state data and state data
   *   is not found
   */
  verifyState<T extends StateData = StateData>(
    stateId: string,
  ): Observable<DeepReadonly<T & StateAuthorizationCode>> {
    return defer(() => this.loadStateData<T & StateAuthorizationCode>(stateId));
  }

  /**
   * Exchange authorization code for the new access token. The method **DO NOT**
   * store the new access token. The new access token **MUST** be stored
   * manually.
   *
   * @param stateId The state ID for exchanging
   * @param authorizationCode The authorization code to be exchanged
   * @returns The `Observable` of immuable access token response and state data
   */
  exchangeAuthorizationCode<T extends StateData = StateData>(
    stateId: string,
    authorizationCode: string,
  ): Observable<{
    accessTokenResponse: DeepReadonly<AccessTokenResponse>;
    stateData: DeepReadonly<T & StateAuthorizationCode>;
  }> {
    return this.verifyState<T>(stateId).pipe(
      switchMap((stateData) => {
        const params: AuthorizationCodeGrantParams = {
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: this.config.redirectUri,
          ...(stateData.codeVerifier
            ? {
                code_verifier: stateData.codeVerifier,
              }
            : {}),
        };

        return this.client.requestAccessToken(params).pipe(
          switchMap((accessTokenResponse) => {
            return from(this.clearState(stateId)).pipe(
              map(() => ({ accessTokenResponse, stateData })),
            );
          }),
        );
      }),
    );
  }
}
