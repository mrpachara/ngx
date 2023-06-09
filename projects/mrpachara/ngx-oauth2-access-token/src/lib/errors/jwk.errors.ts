import { JwkBase, JwtHeader, JwtInfo } from '../types';

export class SignatureNotFoundError extends Error {
  constructor(token: string, jwtInfo: JwtInfo) {
    super(`The JWT signature of '${token}' is not found.`, {
      cause: jwtInfo,
    });
    this.name = this.constructor.name;
  }
}

export class MatchedJwkNotFoundError extends Error {
  constructor(jwtHeader: JwtHeader) {
    super(`The matched JWK for '${JSON.stringify(jwtHeader)}' is not found.`, {
      cause: jwtHeader,
    });
    this.name = this.constructor.name;
  }
}

export class SupportedJwkAlgNotFoundError extends Error {
  constructor(jwks: JwkBase[]) {
    const keyIds = jwks.map((jwk) => `${jwk.kty}:${jwk.kid}`);

    super(`The supported JWK algorithm for '${keyIds}' is not found.`, {
      cause: jwks,
    });
    this.name = this.constructor.name;
  }
}
