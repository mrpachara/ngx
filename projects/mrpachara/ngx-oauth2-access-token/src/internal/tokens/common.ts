import { HttpContextToken } from '@angular/common/http';
import { inject, InjectionToken, Provider, Type } from '@angular/core';

/**
 * The token for `HttpClient` indicates that the request comes from library. It
 * is useful for HTTP request interceptors.
 */
export const OAT_REQUEST = new HttpContextToken(() => false);

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
