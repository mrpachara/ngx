import { OperatorFunction } from 'rxjs';

import { Oauth2Client } from '../services';
import { StoredAccessTokenResponse } from '../storages';
import { AccessTokenFullConfig } from './config.types';
import {
  AccessTokenResponse,
  IdTokenClaims,
  JwtClaims,
  JwtHeader,
  JwtToken,
} from './standard';
import { KeyValuePairsStorage } from './storages.types';
import { DeepReadonly } from './utils';

/** The type of OAuth scopes */
export type Scopes = [string, ...string[]];

/** The type of state data */
export type StateData = object;

/** Access token service information */
export interface AccessTokenServiceInfo<C = unknown> {
  /** The configuration of `AccessTokenService` */
  readonly serviceConfig: AccessTokenFullConfig;

  /** The configuration of extractor */
  readonly config: C;

  /** The OAuth 2.0 client of `AccessTokenService` */
  readonly client: Oauth2Client;

  /** The storage of `AccessTokenService` */
  readonly storage: KeyValuePairsStorage;
}

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
export interface AccessTokenInfo {
  /** The type for using access token */
  readonly type: string;

  /** The access token */
  readonly token: string;
}

/** The state data extension for authorization code */
export type StateAuthorizationCode = StateData & {
  // TODO: add readonly
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
export interface JwtBaseInfo<T extends JwtClaims | EncryptedPayload> {
  /** The JWT */
  readonly token: JwtToken;

  /** The content, to be signed, part of JWT */
  readonly content: string;

  /** The JWT header */
  readonly header: JwtHeader;

  /** The JWT payload */
  readonly payload: T;

  /** The JWT signature */
  readonly signature?: Uint8Array;
}

/** JWT information */
export type JwtInfo<T extends JwtClaims = JwtClaims> = JwtBaseInfo<T>;

/** JWT information **without** knowing payload type */
export type JwtUnknownInfo<T extends JwtClaims = JwtClaims> =
  | JwtInfo<T>
  | JwtBaseInfo<EncryptedPayload>;

/** The access token response extension for ID token response */
export type IdTokenResponse = AccessTokenResponse & {
  /** The ID token */
  readonly id_token?: JwtToken;
};

/** ID token information */
export type IdTokenInfo = JwtInfo<IdTokenClaims>;
