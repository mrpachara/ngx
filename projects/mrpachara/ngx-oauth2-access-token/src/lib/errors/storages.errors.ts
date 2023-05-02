export class AccessTokenNotFoundError extends Error {
  constructor(message = 'Access token is not found.', options?: ErrorOptions) {
    super(message, options);

    if (typeof this.stack === 'undefined') {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, AccessTokenNotFoundError);
      } else {
        this.stack = new Error().stack;
      }
    }

    this.name = this.constructor.name;
  }
}

export class AccessTokenExpiredError extends Error {
  constructor(message = 'Access token has expired.', options?: ErrorOptions) {
    super(message, options);

    if (typeof this.stack === 'undefined') {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, AccessTokenExpiredError);
      } else {
        this.stack = new Error().stack;
      }
    }

    this.name = this.constructor.name;
  }
}

export class RefreshTokenNotFoundError extends Error {
  constructor(message = 'Refresh token is not found.', options?: ErrorOptions) {
    super(message, options);

    if (typeof this.stack === 'undefined') {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, RefreshTokenNotFoundError);
      } else {
        this.stack = new Error().stack;
      }
    }

    this.name = this.constructor.name;
  }
}

export class StateNotFoundError extends Error {
  constructor(message = 'State not found.', options?: ErrorOptions) {
    super(message, options);

    if (typeof this.stack === 'undefined') {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, StateNotFoundError);
      } else {
        this.stack = new Error().stack;
      }
    }

    this.name = this.constructor.name;
  }
}

export class StateExpiredError extends Error {
  constructor(message = 'State has expired.', options?: ErrorOptions) {
    super(message, options);

    if (typeof this.stack === 'undefined') {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, StateExpiredError);
      } else {
        this.stack = new Error().stack;
      }
    }

    this.name = this.constructor.name;
  }
}
