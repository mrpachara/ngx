export type NameableConfig = {
  name: string;
};

export type DebugableConfig = {
  debug?: boolean;
};

export type Oauth2ClientConfig = DebugableConfig & {
  clientId: string;
  clientSecret?: string;
  authorizationCodeUrl: string;
  accessTokenUrl: string;
  clientCredentialsInParams: boolean;
};

export type AccessTokenServiceConfig = NameableConfig &
  DebugableConfig & {
    additionalParams: { [param: string]: string } | null;
  };

export type AuthorizationCodeServiceConfig = NameableConfig &
  DebugableConfig & {
    redirectUri: string;
    pkce: boolean;
  };
