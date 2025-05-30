export class JoseDeserializationError extends Error {
  constructor(serial: string, err: unknown) {
    super(`Deserialize '${serial}' error.`, { cause: err });
    this.name = this.constructor.name;
  }
}
