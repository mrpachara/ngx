import { Inject, Injectable, inject } from '@angular/core';
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
import { AUTHORIZATION_CODE_FULL_CONFIG } from './tokens';
import {
  AccessToken,
  AuthorizationCodeFullConfig,
  AuthorizationCodeGrantParams,
  AuthorizationCodeParams,
  CodeChallengeMethod,
  Scopes,
  StateData,
} from './types';

const stateIdLength = 32;

type GenUrlParams = Omit<AuthorizationCodeParams, 'state'>;

@Injectable({ providedIn: 'root' })
export class AuthorizationCodeService {
  private readonly loadStateData = (stateId: string) =>
    this.storage.loadStateData(stateId);

  private readonly storeStateData = (stateId: string, stateData: StateData) =>
    this.storage.storeStateData(stateId, stateData);

  private readonly removeStateData = (stateId: string) =>
    this.storage.removeStateData(stateId);

  private readonly generateCodeChallenge = async (
    stateData: StateData,
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
    stateData['codeVerifier'] = codeVerifier;

    return {
      code_challenge: codeChallenge,
      code_challenge_method: this.config.pkce,
    };
  };

  private readonly generateAuthorizationCodeUrl = async (
    stateId: string,
    stateData: StateData,
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

  protected readonly storageFactory = inject(AuthorizationCodeStorageFactory);
  protected readonly storage: AuthorizationCodeStorage;

  constructor(
    @Inject(AUTHORIZATION_CODE_FULL_CONFIG)
    protected readonly config: AuthorizationCodeFullConfig,
    protected readonly client: Oauth2Client,
  ) {
    this.storage = this.storageFactory.create(
      this.config.name,
      this.config.stateTtl,
    );
  }

  async fetchAuthorizationCodeUrl(
    scopes: Scopes,
    stateData?: StateData,
    additionalParams?: { [param: string]: string },
  ): Promise<URL> {
    const scope = validateAndTransformScopes(scopes);

    if (scope instanceof InvalidScopeError) {
      throw scope;
    }

    const stateId = randomString(stateIdLength);
    const storedStateData: StateData = {
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

  async clearState(stateId: string): Promise<StateData | null> {
    return await this.removeStateData(stateId);
  }

  verifyState(stateId: string): Observable<StateData> {
    return defer(() => this.loadStateData(stateId));
  }

  exchangeAuthorizationCode(
    stateId: string,
    authorizationCode: string,
  ): Observable<{
    accessToken: AccessToken;
    stateData: StateData;
  }> {
    return this.verifyState(stateId).pipe(
      switchMap((stateData) => {
        const params: AuthorizationCodeGrantParams = {
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: this.config.redirectUri,
        };

        if (stateData['codeVerifier']) {
          params.code_verifier = stateData['codeVerifier'];
        }

        return this.client.requestAccessToken(params).pipe(
          switchMap((accessToken) => {
            return from(this.clearState(stateId)).pipe(
              map(() => ({ accessToken, stateData })),
            );
          }),
        );
      }),
    );
  }
}
