import {
  EncryptedPayload,
  JwtBaseInfo,
  JwtClaims,
  JwtHeader,
  JwtInfo,
  JwtTokenType,
  JwtUnknownInfo,
  Provided,
} from '../types';
import { base64UrlDecode } from './crypto.functions';

/**
 * Extract an information from JWT token.
 *
 * @param token The JWT
 * @returns JWT information with unknown payload type
 */
export function extractJwt<T extends JwtClaims = JwtClaims>(
  token: JwtTokenType,
): JwtUnknownInfo<T> {
  const [headerSegment, payloadSegment, signatureSegment] = token.split(
    '.',
  ) as [string, string, string | undefined];

  const header: JwtHeader = JSON.parse(base64UrlDecode(headerSegment));
  const signature = signatureSegment
    ? Uint8Array.from(base64UrlDecode(signatureSegment), (ch) =>
        ch.charCodeAt(0),
      )
    : undefined;

  let payload: T | EncryptedPayload = base64UrlDecode(payloadSegment);

  if (header.typ === 'JWT' || !header.enc) {
    try {
      payload = JSON.parse(payload) as T;
    } catch (err) {
      console.warn(
        new Error('Cannot decode the payload. The payload may be encrypted.', {
          cause: err,
        }),
      );
    }
  }

  return {
    token,
    content: `${headerSegment}.${payloadSegment}`,
    header,
    payload,
    ...(signature ? { signature } : {}),
  } as JwtUnknownInfo<T>;
}

/**
 * Type guard for provided signature JWT.
 *
 * @param jwtInfo The JWT information with unknown paylod type
 * @returns `true` when `jwtInfo` is `Provided<JwtUnknownInfo<T>, 'signature'>`
 */
export function isProvidedSignature<T extends JwtClaims>(
  jwtInfo: JwtUnknownInfo<T>,
): jwtInfo is Provided<JwtUnknownInfo<T>, 'signature'> {
  return typeof jwtInfo.signature !== 'undefined';
}

/**
 * Type guard for encrypted payload JWT.
 *
 * @param jwtInfo The JWT information with unknown paylod type
 * @returns `true` when `jwtInfo` is `JwtBaseInfo<EncryptedPayload>`
 */
export function isJwtEncryptedPayload<T extends JwtClaims>(
  jwtInfo: JwtUnknownInfo<T>,
): jwtInfo is JwtBaseInfo<EncryptedPayload> {
  return typeof jwtInfo.payload === 'string';
}

/**
 * Type guard for claims payload JWT.
 *
 * @param jwtInfo The JWT information with unknown paylod type
 * @returns `true` when `jwtInfo` is `JwtInfo<T>`
 */
export function isJwtClaimsPayload<T extends JwtClaims>(
  jwtInfo: JwtUnknownInfo<T>,
): jwtInfo is JwtInfo<T> {
  return typeof jwtInfo.payload !== 'string';
}
