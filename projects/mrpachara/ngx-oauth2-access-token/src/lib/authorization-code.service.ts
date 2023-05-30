import { inject } from '@angular/core';
import { defer, from, map, Observable, switchMap } from 'rxjs';

import { InvalidScopeError } from './errors';
import {
  base64UrlEncode,
  randomString,
  sha256,
  validateAndTransformScopes,
} from './functions';
import { Oauth2Client } from './oauth2.client';
import {
  AuthorizationCodeStorage,
  AuthorizationCodeStorageFactory,
} from './storage';
import {
  AccessTokenResponse,
  AuthorizationCodeFullConfig,
  AuthorizationCodeGrantParams,
  AuthorizationCodeParams,
  CodeChallengeMethod,
  Scopes,
  StateAuthorizationCode,
  StateData,
} from './types';

const stateIdLength = 32;

type GenUrlParams = Omit<AuthorizationCodeParams, 'state'>;

export class AuthorizationCodeService {
  protected readonly storageFactory = inject(AuthorizationCodeStorageFactory);
  protected readonly storage: AuthorizationCodeStorage;

  constructor(
    protected readonly config: AuthorizationCodeFullConfig,
    protected readonly client: Oauth2Client,
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

  async fetchAuthorizationCodeUrl<T extends StateData>(
    scopes: Scopes,
    stateData?: T,
    additionalParams?: { [param: string]: string },
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

  async clearState<T extends StateData = StateData>(
    stateId: string,
  ): Promise<(T & StateAuthorizationCode) | null> {
    return await this.removeStateData<T>(stateId);
  }

  verifyState<T extends StateData = StateData>(
    stateId: string,
  ): Observable<T & StateAuthorizationCode> {
    return defer(() => this.loadStateData<T & StateAuthorizationCode>(stateId));
  }

  exchangeAuthorizationCode<T extends StateData = StateData>(
    stateId: string,
    authorizationCode: string,
  ): Observable<{
    accessTokenResponse: AccessTokenResponse;
    stateData: T & StateAuthorizationCode;
  }> {
    return this.verifyState<T>(stateId).pipe(
      switchMap((stateData) => {
        const params: AuthorizationCodeGrantParams = {
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: this.config.redirectUri,
        };

        if (stateData.codeVerifier) {
          params.code_verifier = stateData.codeVerifier;
        }

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
