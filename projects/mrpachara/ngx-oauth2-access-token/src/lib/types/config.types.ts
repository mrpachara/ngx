import { CodeChallengeMethod } from './standard.types';

type NameableConfig = {
  readonly name: string;
};

type DebugableConfig = {
  readonly debug: boolean;
};

type AdditionalParams = {
  readonly additionalParams: { readonly [param: string]: string };
};

export type Oauth2ClientConfig = NameableConfig &
  Partial<DebugableConfig> & {
    readonly clientId: string;
    readonly clientSecret?: string;
    readonly accessTokenUrl: string;
    readonly clientCredentialsInParams?: boolean;
  };

export type AccessTokenConfig = NameableConfig &
  Partial<DebugableConfig> &
  Partial<AdditionalParams> & {
    readonly accessTokenTTL?: number;
    readonly refreshTokenTTL?: number;
  };

export type AuthorizationCodeConfig = NameableConfig &
  Partial<DebugableConfig> &
  Partial<AdditionalParams> & {
    readonly authorizationCodeUrl: string;
    readonly redirectUri: string;
    readonly pkce?: 'none' | CodeChallengeMethod;
    readonly stateTTL?: number;
    readonly codeVerifierLength?: number;
  };
