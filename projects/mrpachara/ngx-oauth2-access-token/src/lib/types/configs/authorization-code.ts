import { CodeChallengeMethod } from '../standards';
import { IdableConfig } from './commons';

/** Authorization code configuration. */
export interface AuthorizationCodeConfig {
  /** The URL of authorization code (consent screen) end point, it is REQUIRED. */
  readonly authorizationCodeUrl: string;

  /** The redirect URI (callback URL) that matchs with client, it is REQUIRED. */
  readonly redirectUri: string;

  /**
   * If authorization code requires _PKCE_, specify the challenge method here.
   * The default value is `'none'`.
   */
  readonly pkce?: CodeChallengeMethod;

  /**
   * The _life-time_ of `state`, the default value is `600_000` miliseconds (10
   * minutes).
   */
  readonly stateTtl?: number;

  /** The code verifier length, the default value is `56`. */
  readonly codeVerifierLength?: number;

  /** The state length, the default value is `32`. */
  readonly stateLength?: number;
}

export interface AuthorizationCodeConfigWithId
  extends IdableConfig,
    AuthorizationCodeConfig {}
