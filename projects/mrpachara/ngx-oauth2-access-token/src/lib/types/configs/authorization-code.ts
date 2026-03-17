import { CodeChallengeMethod } from '@mrpachara/ngx-oauth2-access-token/standard';

/** Authorization code configuration. */
export interface AuthorizationCodeConfig {
  /** The URL of authorization code (consent screen) end point. */
  readonly authorizationCodeUrl: string;

  /** The redirect URI (callback URL) that matches with client. */
  readonly redirectUri: string;

  /** If authorization code requires _PKCE_, specify the challenge method here. */
  readonly pkce?: CodeChallengeMethod;

  /** The _time-to-live_ (seconds) of `state`. */
  readonly stateTtl?: number;

  /** The code verifier length. */
  readonly codeVerifierLength?: number;

  /** The state length. */
  readonly stateLength?: number;
}
