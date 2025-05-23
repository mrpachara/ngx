import { EncodedJwt, JwtClaims, JwtHeader } from './standard';
import { Provided } from './utils';

/** The JSON Web information */
export interface JsonWebInfo<T extends string = string, P = unknown> {
  /** The encoded JSON Web */
  readonly token: T;

  /** The content, to be signed, part of JWT */
  readonly content: string;

  /** The JSON Web header */
  readonly header: JwtHeader;

  /** The JSON Web payload */
  readonly payload: P;

  /** The JSON Web signature */
  readonly signature?: Uint8Array;
}

/** JSON Web information **without** knowing type with `signature` */
export type SignedJsonWebInfo<T extends JsonWebInfo = JsonWebInfo> = Provided<
  T,
  'signature'
>;

/** The type of JWE encripted playload */
export type EncryptedPayload = string;

/** JWT information */
export type JwtInfo<T extends JwtClaims = JwtClaims> = SignedJsonWebInfo<
  JsonWebInfo<EncodedJwt, T>
>;

/** Encrypted JSON Web information */
export type EncryptedJsonWebInfo = JsonWebInfo<string, EncryptedPayload>;

/** JSON Web information **without** knowing type */
export type UnknownJsonWebInfo<T extends JwtClaims = JwtClaims> =
  | JwtInfo<T>
  | EncryptedJsonWebInfo;
