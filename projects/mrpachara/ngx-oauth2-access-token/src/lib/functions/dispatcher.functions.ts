import { ScopesType } from '../types';

export class InvalidScopeError extends Error {
  constructor(message: string) {
    super(message);

    this.name = this.constructor.name;
  }
}

export function validateAndTransformScopes(
  scopes: ScopesType,
): string | InvalidScopeError {
  try {
    const result = scopes
      .map((scope) => scope.trim())
      .filter((scope) => {
        if (scope === '') {
          return false;
        }

        if (scope.match(/\s/) !== null) {
          throw new InvalidScopeError(
            `Space is not allowed in scope, ${JSON.stringify(scopes)}.`,
          );
        }

        return true;
      })
      .join(' ');

    if (result === '') {
      throw new InvalidScopeError(
        `Scopes could not be empty, ${JSON.stringify(scopes)}.`,
      );
    }

    return result;
  } catch (err: unknown) {
    if (err instanceof InvalidScopeError) {
      return err;
    }

    throw err;
  }
}
