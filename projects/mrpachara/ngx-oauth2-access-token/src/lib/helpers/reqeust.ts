import { InvalidScopeError } from '../errors';
import { AdditionalParams, Scopes } from '../types';
import { isArray } from './utility';

/**
 * Validate and transform array of scopes to string.
 *
 * @param scopes The array of scopes
 * @returns The scope text or `InvalidScopeError` when `scopes` is invalid
 * @throws InvalidScopeError
 */
export function validateAndTransformScopes(scopes: Scopes): string {
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
}

/**
 * Assing data to requestable object.
 *
 * @param target Requestable object
 * @param data
 * @param params
 * @returns
 */
export function assignRequestData<T extends URLSearchParams | FormData>(
  target: T,
  data: object,
  { params = {} as AdditionalParams } = {},
): T {
  Object.entries(data)
    .filter(([, value]) => typeof value !== 'undefined')
    .forEach(([key, value]) => target.set(key, `${value}`));

  Object.entries(params).forEach(([key, values]) => {
    (isArray(values) ? values : [values]).forEach((value) =>
      target.append(key, `${value}`),
    );
  });

  return target;
}
