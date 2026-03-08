import { IdKey } from '@mrpachara/ngx-oauth2-access-token';

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
  constructor(id: IdKey, options?: ErrorOptions) {
    super(`ID token of '${id}' has expired.`, options);
    this.name = this.constructor.name;
  }
}

export class IdTokenEncryptedError extends Error {
  constructor(id: IdKey, options?: ErrorOptions) {
    super(
      `ID token of '${id}' must be JWT and cannot be encrypted token.`,
      options,
    );
    this.name = this.constructor.name;
  }
}
