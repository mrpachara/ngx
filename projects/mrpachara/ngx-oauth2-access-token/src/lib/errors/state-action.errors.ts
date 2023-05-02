export class StateActionNotFoundError extends Error {
  constructor(
    actionName: string,
    message = 'State action %s is not found in STATE_ACTION_HANDLERS.',
    options?: ErrorOptions,
  ) {
    super(message.replace(/%s/, actionName), options);

    if (typeof this.stack === 'undefined') {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, StateActionNotFoundError);
      } else {
        this.stack = new Error().stack;
      }
    }

    this.name = this.constructor.name;
  }
}
