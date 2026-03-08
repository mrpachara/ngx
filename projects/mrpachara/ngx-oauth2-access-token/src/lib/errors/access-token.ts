import { IdKey } from '../tokens';

export class AccessTokenNotFoundError extends Error {
  constructor(id: IdKey, options?: ErrorOptions) {
    super(`Access token of '${id}' is not found.`, options);
    this.name = this.constructor.name;
  }
}

export class AccessTokenExpiredError extends Error {
  constructor(id: IdKey, options?: ErrorOptions) {
    super(`Access token of '${id}' has expired.`, options);
    this.name = this.constructor.name;
  }
}

export class RefreshTokenNotFoundError extends Error {
  constructor(id: IdKey, options?: ErrorOptions) {
    super(`Refresh token of '${id}' is not found.`, options);
    this.name = this.constructor.name;
  }
}

export class RefreshTokenExpiredError extends Error {
  constructor(id: IdKey, options?: ErrorOptions) {
    super(`Refresh token of '${id}' has expired.`, options);
    this.name = this.constructor.name;
  }
}

export class NonRegisteredExtractorError extends Error {
  constructor(
    extractorName: string,
    serviceName: string,
    options?: ErrorOptions,
  ) {
    super(
      `Extractor '${extractorName}' was not registered in '${serviceName}'.`,
      options,
    );
    this.name = this.constructor.name;
  }
}
