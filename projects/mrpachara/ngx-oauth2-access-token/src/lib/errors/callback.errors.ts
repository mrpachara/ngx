export class BadRequestCallbackError extends Error {
  constructor(message = 'Bad request to callback.') {
    super(message);

    this.name = this.constructor.name;
  }
}
