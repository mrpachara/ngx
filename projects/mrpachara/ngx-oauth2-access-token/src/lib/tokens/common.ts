import { HttpContextToken } from '@angular/common/http';
import { InjectionToken } from '@angular/core';

/** The injection token for _access token_ ID */
export const ACCESS_TOKEN_ID = new InjectionToken<IdKey>('access-token-id');

/**
 * The token for `HttpClient` indicates that the request requires _access
 * token_, it can be used with `IdKey`.
 */
export const WITH_ACCESS_TOKEN = new HttpContextToken<IdKey | boolean>(
  () => false,
);

const idKeyName = Symbol('id-key-name');

export interface IdKey<N extends string = string> {
  readonly [idKeyName]: N;
}

class IdKeyImplementation<N extends string> implements IdKey<N> {
  readonly [idKeyName]: N;

  constructor(name: N) {
    this[idKeyName] = name;
  }

  toString(): string {
    return this[idKeyName];
  }

  get [Symbol.toStringTag](): string {
    return this.toString();
  }

  [Symbol.toPrimitive](hint: string): string | undefined {
    switch (hint) {
      case 'string':
        return this.toString();
      default:
        return undefined;
    }
  }
}

const existingIdName = new Set<string>();

export function createIdKey<N extends string>(name: N): IdKey<N> {
  if (name.trim() === '') {
    throw new Error(`ID MUST be non-empty string`);
  }

  if (existingIdName.has(name)) {
    throw new Error(`ID '${name}' already exists.`);
  }

  existingIdName.add(name);

  return new IdKeyImplementation(name);
}
