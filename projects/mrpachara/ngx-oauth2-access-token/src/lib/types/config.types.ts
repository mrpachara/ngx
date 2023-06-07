import { AccessTokenResponseExtractor } from './oauth2-services.types';
import { AccessTokenResponse, CodeChallengeMethod } from './standard.types';
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
  };

export type AccessTokenResponseExtractorInfo<
  T extends AccessTokenResponse = AccessTokenResponse,
  C = unknown,
> = readonly [AccessTokenResponseExtractor<T, C>, C];

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

export type RefreshTokenConfig = {
  readonly refreshTokenTtl?: number;
};

export type RefreshTokenFullConfig = Required<RefreshTokenConfig>;

export type IdTokenConfig = {
  readonly providedInAccessToken?: boolean;
};

export type IdTokenFullConfig = Required<IdTokenConfig>;

export type JwkConfig = NameableConfig &
  Partial<DebugableConfig> & {
    readonly issuer: string;
    readonly jwkSetUrl: string;
  };

export type JwkFullConfig = Required<JwkConfig>;
