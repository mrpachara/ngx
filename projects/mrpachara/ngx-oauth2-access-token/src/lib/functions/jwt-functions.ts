import {
  EncryptedPayload,
  JwtBaseInfo,
  JwtClaims,
  JwtHeader,
  JwtInfo,
  JwtTokenType,
  JwtUnknownInfo,
} from '../types';
import { base64UrlDecode } from './crypto.functions';

export function extractJwt<T extends JwtClaims = JwtClaims>(
  token: JwtTokenType,
): JwtUnknownInfo<T> {
  const [headerPart, payloadPart, signature] = token.split('.') as [
    string,
    string,
    string | undefined,
  ];

  const header: JwtHeader = JSON.parse(base64UrlDecode(headerPart));

  let payload: T | EncryptedPayload = base64UrlDecode(payloadPart);

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
    content: `${headerPart}.${payloadPart}`,
    header,
    payload,
    ...(signature ? { signature } : {}),
  } as JwtUnknownInfo<T>;
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
