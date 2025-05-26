import { JoseDeserializationError } from '../errors';
import {
  JoseHeader,
  JoseInfo,
  JosePayloadableInfo,
  JweHeader,
  JweInfo,
  JwsHeader,
  JwsInfo,
  JwtInfo,
} from '../types';
import { base64UrlDecode } from './crypto';

function tryCatch<RC>(projector: () => RC): RC | undefined;
function tryCatch<RC, RE>(
  projector: () => RC,
  errorValue: (err: unknown) => RE,
): RC | RE;
function tryCatch<RC, RE>(
  projector: () => RC,
  errorValue?: (err: unknown) => RE,
) {
  try {
    return projector();
  } catch (err) {
    const result = errorValue?.(err);

    console.warn(err);

    return result;
  }
}

const utf8TextEncoder = new TextEncoder();

export function toUint8Array(value: string, utf8 = false): Uint8Array {
  return !utf8
    ? Uint8Array.from(value, (ch) => ch.charCodeAt(0))
    : utf8TextEncoder.encode(value);
}

/**
 * Deseiralze a JOSE information from the given serial.
 *
 * @param serial Serialized content
 * @returns JSON Web information with unknown payload type
 */
export function deserializeJose<
  P = unknown,
  H extends JoseHeader = JoseHeader,
  const S extends string = string,
>(serial: S) {
  const [headerSegment, ...segments] = serial.split('.', 5);

  const header = tryCatch(
    () => JSON.parse(base64UrlDecode(headerSegment)),
    (err) => {
      throw new JoseDeserializationError(serial, err);
    },
  );

  if (segments.length === 0) {
    return {
      serial,
      header,
    } as JoseInfo<H, S>;
  }

  if (segments.length <= 2) {
    const payloadSegment = segments[0];

    const decodedPayload = base64UrlDecode(payloadSegment);

    const payload = tryCatch(
      () => JSON.parse(decodedPayload),
      () => decodedPayload,
    );

    if (segments.length === 1) {
      return {
        serial,
        header,
        payload,
      } as JosePayloadableInfo<P, H, S> | JosePayloadableInfo<string, H, S>;
    }

    const decodedSignature = base64UrlDecode(segments[1]);

    const signature = toUint8Array(decodedSignature);

    const protectedContent = toUint8Array(
      `${headerSegment}.${payloadSegment}`,
      true,
    );

    return {
      serial,
      header,
      payload,
      signature,
      protectedContent,
    } as JwsInfo<P, H & JwsHeader> | JwsInfo<string, H & JwsHeader>;
  }
  if (segments.length === 4) {
    const [encryptedKey, initializationVector, ciphertext, authenticationTag] =
      segments.map((segment) => toUint8Array(base64UrlDecode(segment)));

    return {
      serial,
      header,
      encryptedKey,
      initializationVector,
      ciphertext,
      authenticationTag,
    } as JweInfo<H & JweHeader>;
  }

  return {
    serial,
    header,
    payload: segments.join('.'),
  } as JosePayloadableInfo<string, H, S>;
}

/**
 * Type guard for JWS.
 *
 * @param joseInfo The JOSE information
 * @returns `true` when `joseInfo` is `JwsInfo`
 */
export function isJws(joseInfo: JoseInfo): joseInfo is JwsInfo {
  const partialJwsInfo = joseInfo as JoseInfo & Partial<JwsInfo>;

  return (
    partialJwsInfo.protectedContent instanceof Uint8Array &&
    partialJwsInfo.signature instanceof Uint8Array
  );
}

/**
 * Type guard for JWE.
 *
 * @param joseInfo The JOSE information
 * @returns `true` when `joseInfo` is `JweInfo`
 */
export function isJwe(joseInfo: JoseInfo): joseInfo is JweInfo {
  const partialJweInfo = joseInfo as JoseInfo & Partial<JweInfo>;

  return (
    partialJweInfo.encryptedKey instanceof Uint8Array &&
    partialJweInfo.initializationVector instanceof Uint8Array &&
    partialJweInfo.ciphertext instanceof Uint8Array &&
    partialJweInfo.authenticationTag instanceof Uint8Array
  );
}

/**
 * Type guard for JWT.
 *
 * @param joseInfo The JOSE information
 * @param type The required JWS or JWE, if undefined allow both
 * @returns `true` when `joseInfo` is `JwtInfo`
 */
export function isJwt(
  joseInfo: JoseInfo,
  type: 'JWS',
): joseInfo is Extract<JwtInfo, JwsInfo>;

export function isJwt(
  joseInfo: JoseInfo,
  type: 'JWE',
): joseInfo is Extract<JwtInfo, JweInfo>;

export function isJwt(joseInfo: JoseInfo): joseInfo is JwtInfo;

export function isJwt(joseInfo: JoseInfo, type?: 'JWS' | 'JWE') {
  if ((typeof type === 'undefined' || type === 'JWS') && isJws(joseInfo)) {
    return (
      joseInfo.header.typ === 'JWT' ||
      (!!joseInfo.payload && typeof joseInfo.payload === 'object')
    );
  } else if (
    (typeof type === 'undefined' || type === 'JWE') &&
    isJwe(joseInfo)
  ) {
    return joseInfo.header.typ === 'JWT';
  }

  return false;
}
