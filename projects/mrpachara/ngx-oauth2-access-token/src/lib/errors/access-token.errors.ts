export class UpdateToAccessTokenResponseListenerError extends Error {
  constructor(name: string, cause: unknown) {
    super(`Error on '${name}'.`, {
      cause,
    });
    this.name = this.constructor.name;
  }
}
