import { InjectionToken, Provider, Type, inject } from '@angular/core';

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
