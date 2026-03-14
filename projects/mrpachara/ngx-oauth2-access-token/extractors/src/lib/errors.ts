import { IdKey } from '@mrpachara/ngx-oauth2-access-token';
import {
  IdTokenClaims,
  IdTokenInfo,
  JoseInfo,
} from '@mrpachara/ngx-oauth2-access-token/standard';

export class IdTokenInfoNotFoundError extends Error {
  constructor(id: IdKey, options?: ErrorOptions) {
    super(`ID token infomation of '${id}' is not found.`, options);
    this.name = this.constructor.name;
  }
}

export class IdTokenClaimsNotFoundError extends Error {
  constructor(id: IdKey, options?: ErrorOptions) {
    super(`ID token claims of '${id}' is not found.`, options);
    this.name = this.constructor.name;
  }
}

export class IdTokenExpiredError extends Error {
  override readonly cause!: IdTokenInfo;

  constructor(id: IdKey, idTokenInfo: IdTokenInfo) {
    super(`ID token of '${id}' has expired.`, {
      cause: idTokenInfo,
    });
    this.name = this.constructor.name;
  }
}

export class IdTokenClaimsExpiredError extends Error {
  override readonly cause!: IdTokenClaims;

  constructor(id: IdKey, idTokenClaims: IdTokenClaims) {
    super(`ID token claims of '${id}' has expired.`, {
      cause: idTokenClaims,
    });
    this.name = this.constructor.name;
  }
}

export class InvalidIdTokenPayloadError extends Error {
  override readonly cause!: JoseInfo;

  constructor(id: IdKey, info: JoseInfo) {
    super(`ID token of '${id}' is invalid payload.`, { cause: info });
    this.name = this.constructor.name;
  }
}

export class EncryptedIdTokenError extends Error {
  override readonly cause!: JoseInfo;

  constructor(id: IdKey, info: JoseInfo) {
    super(`ID token of '${id}' must be JWT and is not encrypted token.`, {
      cause: info,
    });
    this.name = this.constructor.name;
  }
}
