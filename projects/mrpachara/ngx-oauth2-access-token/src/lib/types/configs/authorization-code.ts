import { CodeChallengeMethod } from '../standards';

/** Authorization code configuration. */
export interface AuthorizationCodeConfig {
  /** The URL of authorization code (consent screen) end point, it is REQUIRED. */
  readonly authorizationCodeUrl: string;

  /** The redirect URI (callback URL) that matchs with client, it is REQUIRED. */
  readonly redirectUri: string;

  /** If authorization code requires _PKCE_, specify the challenge method here. */
  readonly pkce?: CodeChallengeMethod;

  /** The _time-to-live_ of `state`. */
  readonly stateTtl?: number;

  /** The code verifier length. */
  readonly codeVerifierLength?: number;

  /** The state length. */
  readonly stateLength?: number;
}
