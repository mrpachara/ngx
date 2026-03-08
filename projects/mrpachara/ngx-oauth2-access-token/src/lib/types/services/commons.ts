import { InjectionToken } from '@angular/core';

/** The type of OAuth scopes */
export type Scopes = readonly [string, ...string[]];

/** Additional parameters for requesting */
export type AdditionalParams = Readonly<
  Record<
    string,
    string | number | boolean | readonly (string | number | boolean)[]
  >
>;

export type TypeOfToken<I extends InjectionToken<unknown>> =
  I extends InjectionToken<infer T> ? T : never;
