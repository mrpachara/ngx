import { IdableConfig } from './commons';

/** OAuth 2.0 client configuration */
export interface Oauth2ClientConfig extends IdableConfig {
  /** OAuth client ID, it is REQUIRED. */
  readonly clientId: string;

  /** OAuth client secret if needed, it is an OPTIONAL. */
  readonly clientSecret?: string;

  /** The URL of access token end point, it is REQUIRED. */
  readonly accessTokenUrl: string;

  /**
   * By default, the client credentials is sent by using HTTP header
   * `Authorization`. If this property is `true`, the client credentials will be
   * sent by using body content.
   */
  readonly clientCredentialsInParams?: boolean;
}
