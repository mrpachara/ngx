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

export function isProvidedSignature<T extends JwtClaims>(
  jwtInfo: JwtUnknownInfo<T>,
): jwtInfo is Provided<JwtUnknownInfo<T>, 'signature'> {
  return typeof jwtInfo.signature !== 'undefined';
}

export function isJwtEncryptedPayload<T extends JwtClaims>(
  jwtInfo: JwtUnknownInfo<T>,
): jwtInfo is JwtBaseInfo<EncryptedPayload> {
  return typeof jwtInfo.payload === 'string';
}

export function isJwtClaimsPayload<T extends JwtClaims>(
  jwtInfo: JwtUnknownInfo<T>,
): jwtInfo is JwtInfo<T> {
  return typeof jwtInfo.payload !== 'string';
}
