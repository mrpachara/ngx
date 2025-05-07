export class StateActionNotFoundError extends Error {
  constructor(
    actionName: string,
    message = 'State action %s is not found in STATE_ACTION_HANDLERS.',
    options?: ErrorOptions,
  ) {
    super(message.replace(/%s/, actionName), options);
    this.name = this.constructor.name;
  }
}
