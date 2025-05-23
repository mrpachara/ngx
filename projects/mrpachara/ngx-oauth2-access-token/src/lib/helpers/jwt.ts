import {
  EncodedJsonWeb,
  EncryptedJsonWebInfo,
  EncryptedPayload,
  JsonWebInfo,
  JwtClaims,
  JwtHeader,
  JwtInfo,
  SignedJsonWebInfo,
  UnknownJsonWebInfo,
} from '../types';
import { base64UrlDecode } from './crypto';

/**
 * Extract an information from JWT token.
 *
 * @param token Encoded JSON Web
 * @returns JSON Web information with unknown payload type
 */
export function extractJsonWeb<P extends JwtClaims = JwtClaims>(
  token: EncodedJsonWeb,
): UnknownJsonWebInfo<P> {
  const [headerSegment, payloadSegment, signatureSegment] = token.split(
    '.',
  ) as [string, string, string | undefined];

  const header: JwtHeader = JSON.parse(base64UrlDecode(headerSegment));
  const signature = signatureSegment
    ? Uint8Array.from(base64UrlDecode(signatureSegment), (ch) =>
        ch.charCodeAt(0),
      )
    : undefined;

  const payload = (() => {
    const decodedPayload: EncryptedPayload = base64UrlDecode(payloadSegment);

    if (header.typ === 'JWT' || !header.enc) {
      try {
        return JSON.parse(decodedPayload) as P;
      } catch (err) {
        console.warn(
          new Error(
            'Cannot decode the payload. The payload may be encrypted.',
            {
              cause: err,
            },
          ),
        );
      }
    }

    return decodedPayload;
  })();

  return {
    token,
    content: `${headerSegment}.${payloadSegment}`,
    header,
    payload,
    ...(signature ? { signature } : {}),
  } as UnknownJsonWebInfo<P>;
}

/**
 * Type guard for provided signature JWT.
 *
 * @param jsonWebInfo The JSON Web information with unknown paylod type
 * @returns `true` when `jsonWebInfo` is `Provided<UnknownJsonWebInfo<T>,
 *   'signature'>`
 */
export function isProvidedSignature<T extends JsonWebInfo>(
  jsonWebInfo: T,
): jsonWebInfo is SignedJsonWebInfo<T> {
  return typeof jsonWebInfo.signature !== 'undefined';
}

/**
 * Type guard for encrypted payload JWT.
 *
 * @param jsonWebInfo The JSON Web information with unknown paylod type
 * @returns `true` when `jsonWebInfo` is `EncryptedJsonWebInfo`
 */
export function isEncryptedJsonWeb(
  jsonWebInfo: JsonWebInfo,
): jsonWebInfo is EncryptedJsonWebInfo {
  return typeof jsonWebInfo.payload === 'string';
}

/**
 * Type guard for claims payload JWT.
 *
 * @param jsonWebInfo The JSON Web information
 * @returns `true` when `jsonWebInfo` is `JwtInfo<T>`
 */
export function isJwt<T extends JwtInfo>(
  jsonWebInfo: T,
): jsonWebInfo is Extract<T, JwtInfo>;

export function isJwt(jsonWebInfo: JsonWebInfo): jsonWebInfo is JwtInfo;

export function isJwt(jsonWebInfo: JsonWebInfo) {
  return (
    isProvidedSignature(jsonWebInfo) && typeof jsonWebInfo.payload !== 'string'
  );
}
