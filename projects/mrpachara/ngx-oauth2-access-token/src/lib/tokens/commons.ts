import { HttpContextToken } from '@angular/common/http';
import { inject, InjectionToken, Provider, Type } from '@angular/core';

/**
 * The token for `HttpClient` indicates that the request comes from library. It
 * is useful for HTTP request interceptors.
 */
export const OAT_REQUEST = new HttpContextToken(() => false);

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

export function provideHierarchization<T>(
  parentToken: InjectionToken<T[]> | Type<T>,
  chlidToken: InjectionToken<T[]> | Type<T>,
  factory: () => T,
): Provider {
  return [
    {
      provide: chlidToken,
      multi: true,
      useFactory: factory,
    },
    {
      provide: parentToken,
      useFactory: () => [
        ...(inject(parentToken, {
          skipSelf: true,
          optional: true,
        }) ?? []),
        ...inject(chlidToken),
      ],
    },
  ];
}
