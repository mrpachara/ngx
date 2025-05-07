import { InvalidScopeError } from '../errors';
import { Scopes } from '../types';

/**
 * Validate and transform array of scopes to string.
 *
 * @param scopes The array of scopes
 * @returns The scope text or `InvalidScopeError` when `scopes` is invalid
 */
export function validateAndTransformScopes(
  scopes: Scopes,
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
            `Spaces are not allowed in scope, ${JSON.stringify(scopes)}.`,
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
