import { PickOptionalExcept } from '@mrpachara/ngx-oauth2-access-token/utility';
import { AuthorizationCodeConfig } from '../types';

/** Default _state_ length, `32` characters */
export const defaultStateLength = 32;

/** Default _state_ TTL, `600` seconds (10 minutes) */
export const defaultStateTtl = 600;

/** Default _code verifier_ length, `64` characters */
export const defaultCodeVerifierLength = 64;

/** Default authorization code configuration */
export const defaultConfiguration: PickOptionalExcept<
  AuthorizationCodeConfig,
  'pkce'
> = {
  stateLength: defaultStateLength,
  stateTtl: defaultStateTtl,
  codeVerifierLength: defaultCodeVerifierLength,
} as const;
