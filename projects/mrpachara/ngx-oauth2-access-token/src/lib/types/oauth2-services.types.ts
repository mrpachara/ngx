import { JwtInfo } from './jwt';
import { IdTokenClaims } from './standard';

// /** The type of state data */
// type StateData = object;

/** Access token service information */
// export interface AccessTokenServiceInfo<C = unknown> {
//   /** The configuration of `AccessTokenService` */
//   readonly serviceConfig: AccessTokenFullConfig;

//   /** The configuration of extractor */
//   readonly config: C;

//   /** The OAuth 2.0 client of `AccessTokenService` */
//   readonly client: Oauth2Client;

//   /** The storage of `AccessTokenService` */
//   readonly storage: KeyValuePairsStorage;
// }

// /** Access token response information */
// export type AccessTokenResponseInfo<
//   T extends AccessTokenResponse = AccessTokenResponse,
// > = StoredAccessTokenResponse<T>;

// /** The return type of `AccessTokenResponseExtractor.extractPipe()` */
// export type ExtractorPipeReturn<
//   T extends AccessTokenResponse = AccessTokenResponse,
//   R = unknown,
// > = OperatorFunction<DeepReadonly<AccessTokenResponseInfo<T>>, R>;

// /**
//  * The interface of access token response extractor. All methods will be called
//  * by `AccessTokenService` internally.
//  *
//  * Only use extractor when you want to use internal properties of
//  * `AccessTokenService`, e.g. OAuth client or storage. Other use-cases, just
//  * simply use `AccessTokenService.fetchResponse()`.
//  */
// export interface AccessTokenResponseExtractor<
//   T extends AccessTokenResponse = AccessTokenResponse,
//   C = unknown,
//   R = unknown,
// > {
//   /**
//    * This method will be called when `AccessTokenService` store the new access
//    * token response informatoin.
//    *
//    * @param serviceInfo The service information of `AccessTokenService`
//    * @param accessTokenResponseInfo The access token response information
//    * @returns The `Promise` of `void`.
//    */
//   onAccessTokenResponseUpdate?(
//     serviceInfo: AccessTokenServiceInfo<C>,
//     accessTokenResponseInfo: DeepReadonly<AccessTokenResponseInfo<T>>,
//   ): Promise<void>;

//   /**
//    * This method will be called when `AccessTokenService` clear the access token
//    * response inforamtion from storage.
//    *
//    * @param serviceInfo The service information of `AccessTokenService`
//    * @returns The `Promise` of `void`.
//    */
//   onAccessTokenResponseClear?(
//     serviceInfo: AccessTokenServiceInfo<C>,
//   ): Promise<void>;

//   /**
//    * This method will be called when the extractor is used with
//    * `AccessTokenService.extract()`.
//    *
//    * @param serviceInfo The service information of `AccessTokenService`
//    * @returns The _observable pipe_ for extracted information
//    * @see `AccessTokeService.extract()`
//    */
//   extractPipe(
//     serviceInfo: AccessTokenServiceInfo<C | undefined>,
//   ): ExtractorPipeReturn<T, R>;
// }

// /** The state data extension for authorization code */
// export type StateAuthorizationCode = StateData & {
//   // TODO: add readonly
//   /** The code verifier for PKCE */
//   codeVerifier?: string;
// };

// /** Access token response extractor information */
// export type AccessTokenResponseExtractorInfo<
//   T extends AccessTokenResponse = AccessTokenResponse,
//   C = unknown,
// > = readonly [AccessTokenResponseExtractor<T, C>, C];

/** ID token information */
export type IdTokenInfo = JwtInfo<IdTokenClaims>;
