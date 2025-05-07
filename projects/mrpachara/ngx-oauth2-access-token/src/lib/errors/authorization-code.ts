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
