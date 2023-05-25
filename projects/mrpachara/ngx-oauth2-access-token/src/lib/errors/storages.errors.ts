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

export class StateNotFoundError extends Error {
  constructor(message = 'State not found.', options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class StateExpiredError extends Error {
  constructor(message = 'State has expired.', options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class IdTokenNotFoundError extends Error {
  constructor(name: string, options?: ErrorOptions) {
    super(`ID token of '${name}' is not found.`, options);
    this.name = this.constructor.name;
  }
}

export class IdTokenExpiredError extends Error {
  constructor(name: string, options?: ErrorOptions) {
    super(`ID token of '${name}' has expired.`, options);
    this.name = this.constructor.name;
  }
}

export class IdTokenEncryptedError extends Error {
  constructor(name: string, options?: ErrorOptions) {
    super(
      `ID token of '${name}' must be JWT and cannot be encrypted token.`,
      options,
    );
    this.name = this.constructor.name;
  }
}
