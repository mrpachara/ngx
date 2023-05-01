import {
  FactoryProvider,
  Inject,
  Injectable,
  InjectionToken,
} from '@angular/core';
import { map, Observable, switchMap, throwError } from 'rxjs';

import {
  base64UrlEncode,
  InvalidScopeError,
  randomString,
  sha256,
  validateAndTransformScopes,
} from './functions';
import { Oauth2Client } from './oauth2.client';
import {
  AUTHORIZATION_CODE_SERVICE_CONFIG,
  AUTHORIZATION_CODE_STORAGE_FACTORY,
} from './tokens';
import {
  AccessToken,
  AuthorizationCodeServiceConfig,
  AuthorizationCodeGrantParams,
  AuthorizationCodeParams,
  AuthorizationCodeStorage,
  AuthorizationCodeStorageFactory,
  ScopesType,
  StateData,
} from './types';

const codeVerifierLength = 56;
const stateIdLength = 32;

export function createAuthorizationCodeServiceProvider(
  providedToken:
    | InjectionToken<AuthorizationCodeService>
    | typeof AuthorizationCodeService,
  config: AuthorizationCodeServiceConfig,
  clientToken: InjectionToken<Oauth2Client> | typeof Oauth2Client,
  storageFactoryToken?: InjectionToken<AuthorizationCodeStorageFactory>,
): FactoryProvider {
  return {
    provide: providedToken,
    useFactory: (
      client: Oauth2Client,
      storageFactory: AuthorizationCodeStorageFactory,
    ): AuthorizationCodeService =>
      new AuthorizationCodeService(config, client, storageFactory),
    deps: [
      clientToken,
      storageFactoryToken
        ? storageFactoryToken
        : AUTHORIZATION_CODE_STORAGE_FACTORY,
    ],
  };
}

@Injectable()
export class AuthorizationCodeService {
  private readonly loadStateData = (stateId: string) =>
    this.storage.loadStateData(stateId);

  private readonly storeStateData = (stateId: string, stateData: StateData) =>
    this.storage.storeStateData(stateId, stateData);

  private readonly removeStateData = (stateId: string) =>
    this.storage.removeStateData(stateId);

  private readonly generateCodeChallenge = (): Observable<{
    codeChallenge: string;
    codeVerifier: string;
  }> => {
    const codeVerifier = randomString(codeVerifierLength);

    return sha256(codeVerifier).pipe(
      map(base64UrlEncode),
      map((codeChallenge) => {
        return {
          codeChallenge: codeChallenge,
          codeVerifier: codeVerifier,
        };
      }),
    );
  };

  private readonly generateAuthorizationCodeUrl = (
    stateId: string,
    stateData: StateData,
    authorizationCodeParams: AuthorizationCodeParams,
  ): Observable<URL> => {
    return this.storeStateData(stateId, stateData).pipe(
      switchMap(() =>
        this.client.generateAuthorizationCodeUrl(authorizationCodeParams),
      ),
    );
  };

  private readonly storage: AuthorizationCodeStorage;

  constructor(
    @Inject(AUTHORIZATION_CODE_SERVICE_CONFIG)
    private readonly config: AuthorizationCodeServiceConfig,
    private readonly client: Oauth2Client,
    @Inject(AUTHORIZATION_CODE_STORAGE_FACTORY)
    storageFactory: AuthorizationCodeStorageFactory,
  ) {
    this.storage = storageFactory.create(this.config.name);
  }

  fetchAuthorizationCodeUrl(
    scopes: ScopesType,
    stateData?: StateData,
    additionalParams?: { [param: string]: string },
  ): Observable<URL> {
    const scope = validateAndTransformScopes(scopes);

    if (scope instanceof InvalidScopeError) {
      return throwError(() => scope);
    }

    const stateId = randomString(stateIdLength);
    const storedStateData: StateData = {
      ...stateData,
    };

    const authorizationCodeParams: AuthorizationCodeParams = {
      ...additionalParams,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: scope,
      state: stateId,
    };

    if (!this.config.pkce) {
      return this.generateAuthorizationCodeUrl(
        stateId,
        storedStateData,
        authorizationCodeParams,
      );
    }

    return this.generateCodeChallenge().pipe(
      switchMap((codePair) => {
        storedStateData['codeVerifier'] = codePair.codeVerifier;
        authorizationCodeParams.code_challenge = codePair.codeChallenge;
        authorizationCodeParams.code_challenge_method = 'S256';

        return this.generateAuthorizationCodeUrl(
          stateId,
          storedStateData,
          authorizationCodeParams,
        );
      }),
    );
  }

  verifyState(stateId: string): Observable<StateData> {
    return this.loadStateData(stateId);
  }

  clearState(stateId: string): Observable<true> {
    return this.removeStateData(stateId);
  }

  exchangeAuthorizationCode(
    stateId: string,
    stateData: StateData,
    authorizationCode: string,
  ): Observable<AccessToken> {
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
        return this.clearState(stateId).pipe(map(() => accessToken));
      }),
    );
  }
}
