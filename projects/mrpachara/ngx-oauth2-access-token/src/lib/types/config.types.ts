import { CodeChallengeMethod } from './standard.types';
import { RequiredExcept } from './utils.type';

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

export type Oauth2ClientFullConfig = RequiredExcept<
  Oauth2ClientConfig,
  'clientSecret'
>;

export type AccessTokenConfig = NameableConfig &
  Partial<DebugableConfig> &
  Partial<AdditionalParams> & {
    readonly accessTokenTtl?: number;
    readonly refreshTokenTtl?: number;
  };
export type AccessTokenFullConfig = Required<AccessTokenConfig>;

export type AuthorizationCodeConfig = NameableConfig &
  Partial<DebugableConfig> &
  Partial<AdditionalParams> & {
    readonly authorizationCodeUrl: string;
    readonly redirectUri: string;
    readonly pkce?: 'none' | CodeChallengeMethod;
    readonly stateTtl?: number;
    readonly codeVerifierLength?: number;
  };

export type AuthorizationCodeFullConfig = Required<AuthorizationCodeConfig>;

export type IdTokenConfig = NameableConfig &
  Partial<DebugableConfig> & {
    jwksUrl?: string;
    providedInAccessToken?: boolean;
  };

export type IdTokenFullConfig = RequiredExcept<IdTokenConfig, 'jwksUrl'>;
