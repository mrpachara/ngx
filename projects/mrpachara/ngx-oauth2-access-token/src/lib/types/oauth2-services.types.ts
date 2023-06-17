import { OperatorFunction } from 'rxjs';

import { AccessTokenFullConfig } from './config.types';
import {
  AccessTokenResponse,
  IdTokenClaims,
  JwtClaims,
  JwtHeader,
  JwtTokenType,
} from './standard.types';
import { KeyValuePairsStorage } from './storages.types';
import { DeepReadonly } from './utils.type';

import { Oauth2Client } from '../services';
import { StoredAccessTokenResponse } from '../storage';

/** The type of OAuth scopes */
export type Scopes = [string, ...string[]];

/** The type of state data */
export type StateData = object;

/** Access token service information */
export type AccessTokenServiceInfo<C = unknown> = {
  /** The configuration of `AccessTokenService` */
  serviceConfig: AccessTokenFullConfig;

  /** The configuration of extractor */
  config: C;

  /** The OAuth 2.0 client of `AccessTokenService` */
  client: Oauth2Client;

  /** The storage of `AccessTokenService` */
  storage: KeyValuePairsStorage;
};

/** Access token response information */
export type AccessTokenResponseInfo<
  T extends AccessTokenResponse = AccessTokenResponse,
> = StoredAccessTokenResponse<T>;

/** The return type of `AccessTokenResponseExtractor.extractPipe()` */
export type ExtractorPipeReturn<
  T extends AccessTokenResponse = AccessTokenResponse,
  R = unknown,
> = OperatorFunction<DeepReadonly<AccessTokenResponseInfo<T>>, R>;

/**
 * The interface of access token response extractor. All methods will be called
 * by `AccessTokenService` internally.
 *
 * Only use extractor when you want to use internal properties of
 * `AccessTokenService`, e.g. OAuth client or storage. Other use-cases, just
 * simply use `AccessTokenService.fetchResponse()`.
 */
export interface AccessTokenResponseExtractor<
  T extends AccessTokenResponse = AccessTokenResponse,
  C = unknown,
  R = unknown,
> {
  /**
   * This method will be called when `AccessTokenService` store the new access
   * token response informatoin.
   *
   * @param serviceInfo The service information of `AccessTokenService`
   * @param accessTokenResponseInfo The access token response information
   * @returns The `Promise` of `void`.
   */
  onAccessTokenResponseUpdate?(
    serviceInfo: AccessTokenServiceInfo<C>,
    accessTokenResponseInfo: DeepReadonly<AccessTokenResponseInfo<T>>,
  ): Promise<void>;

  /**
   * This method will be called when `AccessTokenService` clear the access token
   * response inforamtion from storage.
   *
   * @param serviceInfo The service information of `AccessTokenService`
   * @returns The `Promise` of `void`.
   */
  onAccessTokenResponseClear?(
    serviceInfo: AccessTokenServiceInfo<C>,
  ): Promise<void>;

  /**
   * This method will be called when the extractor is used with
   * `AccessTokenService.extract()`.
   *
   * @param serviceInfo The service information of `AccessTokenService`
   * @returns The _observable pipe_ for extracted information
   * @see `AccessTokeService.extract()`
   */
  extractPipe(
    serviceInfo: AccessTokenServiceInfo<C | undefined>,
  ): ExtractorPipeReturn<T, R>;
}

/** Access token information */
export type AccessTokenInfo = {
  /** The type for using access token */
  type: string;

  /** The access token */
  token: string;
};

/** The state data extension for authorization code */
export type StateAuthorizationCode = StateData & {
  /** The code verifier for PKCE */
  codeVerifier?: string;
};

/** Access token response extractor information */
export type AccessTokenResponseExtractorInfo<
  T extends AccessTokenResponse = AccessTokenResponse,
  C = unknown,
> = readonly [AccessTokenResponseExtractor<T, C>, C];

/** The type of JWT encripted playload */
export type EncryptedPayload = string;

/** The JWT base information */
export type JwtBaseInfo<T extends JwtClaims | EncryptedPayload> = {
  /** The JWT */
  token: JwtTokenType;

  /** The content, to be signed, part of JWT */
  content: string;

  /** The JWT header */
  header: JwtHeader;

  /** The JWT payload */
  payload: T;

  /** The JWT signature */
  signature?: Uint8Array;
};

/** JWT information */
export type JwtInfo<T extends JwtClaims = JwtClaims> = JwtBaseInfo<T>;

/** JWT information **without** knowing payload type */
export type JwtUnknownInfo<T extends JwtClaims = JwtClaims> =
  | JwtInfo<T>
  | JwtBaseInfo<EncryptedPayload>;

/** The access token response extension for ID token response */
export type IdTokenResponse = AccessTokenResponse & {
  /** The ID token */
  id_token?: JwtTokenType;
};

/** ID token information */
export type IdTokenInfo = JwtInfo<IdTokenClaims>;
