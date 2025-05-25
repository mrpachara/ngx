import { Jwk, JwsInfo, JwtInfo } from '../types';

export class NonprovidedIssuerError extends Error {
  constructor(jwtOverJwsInfo: Extract<JwtInfo, JwsInfo>) {
    const { header, payload } = jwtOverJwsInfo;

    super(
      `The Issuer is not found for:\n${JSON.stringify({ header, payload }, undefined, 2)}`,
      {
        cause: jwtOverJwsInfo,
      },
    );
    this.name = this.constructor.name;
  }
}

export class MatchedIssuerNotFoundError extends Error {
  constructor(issuer: string) {
    super(`The JWK Set for '${issuer}' is not found.`);
    this.name = this.constructor.name;
  }
}

export class MatchedJwkNotFoundError extends Error {
  constructor(jwtInfo: JwtInfo) {
    super(
      `The matched JWK is not found for:\n${JSON.stringify(jwtInfo.header, undefined, 2)}`,
      { cause: jwtInfo },
    );
    this.name = this.constructor.name;
  }
}

export class SupportedJwkAlgNotFoundError extends Error {
  constructor(jwks: Jwk[]) {
    const keyIds = jwks.map((jwk) => `${jwk.kty}:${jwk.kid}`);

    super(`The supported JWK algorithm for '${keyIds}' is not found.`, {
      cause: jwks,
    });
    this.name = this.constructor.name;
  }
}
