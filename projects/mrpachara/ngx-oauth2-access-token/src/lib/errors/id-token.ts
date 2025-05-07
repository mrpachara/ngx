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
