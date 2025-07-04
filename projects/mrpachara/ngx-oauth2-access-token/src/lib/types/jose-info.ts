import {
  CompactJws,
  IdTokenClaims,
  JoseHeader,
  JweHeader,
  JwsHeader,
  JwtClaims,
  JwtHeader,
} from './standards';

/** The JSON Web with JOSE header information */
export interface JoseInfo<
  H extends JoseHeader = JoseHeader,
  S extends string = string,
> {
  /** The serialized content */
  readonly serial: S;

  /** The JOSE Header */
  readonly header: H;
}

/** The JSON Web with JOSE header information */
export interface JosePayloadableInfo<
  P = unknown,
  H extends JoseHeader = JoseHeader,
  S extends string = string,
> extends JoseInfo<H, S> {
  /** JOSE payload */
  readonly payload: P;
}

/** The JWS information */
export interface JwsInfo<P = unknown, H extends JwsHeader = JwsHeader>
  extends JosePayloadableInfo<P, H, CompactJws> {
  /** The JWS signature */
  readonly signature: Readonly<Uint8Array>;

  /** The protected part, to be signed, of JWS */
  readonly protectedContent: Readonly<Uint8Array>;
}

/** The JWE information */
export interface JweInfo<H extends JweHeader = JweHeader>
  extends JoseInfo<H, CompactJws> {
  readonly encryptedKey: Readonly<Uint8Array>;

  readonly initializationVector: Readonly<Uint8Array>;

  readonly ciphertext: Readonly<Uint8Array>;

  readonly authenticationTag: Readonly<Uint8Array>;
}

/** JWT information */
export type JwtInfo<P extends JwtClaims = JwtClaims> =
  | JwsInfo<P, JwsHeader & JwtHeader>
  | JweInfo<JweHeader & JwtHeader>;

/** ID Token information */
export type IdTokenInfo<P extends IdTokenClaims = IdTokenClaims> = Extract<
  JwtInfo<P>,
  JwsInfo
>;
