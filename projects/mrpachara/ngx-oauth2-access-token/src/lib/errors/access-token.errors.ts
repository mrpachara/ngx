export class AccessTokenNotFoundError extends Error {
  constructor(name: string, options?: ErrorOptions) {
    super(`Access token of '${name}' is not found.`, options);
    this.name = this.constructor.name;
  }
}

export class AccessTokenExpiredError extends Error {
  constructor(name: string, options?: ErrorOptions) {
    super(`Access token of '${name}' has expired.`, options);
    this.name = this.constructor.name;
  }
}

export class RefreshTokenNotFoundError extends Error {
  constructor(name: string, options?: ErrorOptions) {
    super(`Refresh token of '${name}' is not found.`, options);
    this.name = this.constructor.name;
  }
}

export class RefreshTokenExpiredError extends Error {
  constructor(name: string, options?: ErrorOptions) {
    super(`Refresh token of '${name}' has expired.`, options);
    this.name = this.constructor.name;
  }
}
