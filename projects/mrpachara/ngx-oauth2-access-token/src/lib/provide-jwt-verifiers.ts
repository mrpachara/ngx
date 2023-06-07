import {
  EnvironmentProviders,
  ExistingProvider,
  InjectionToken,
  Type,
  makeEnvironmentProviders,
} from '@angular/core';

import { JWT_VERIFIERS } from './tokens';
import { JwtVerifier } from './types';

export function provideJwtVerifiers(
  ...verifiers: (Type<JwtVerifier> | InjectionToken<JwtVerifier>)[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    verifiers.map(
      (verifier) =>
        ({
          provide: JWT_VERIFIERS,
          multi: true,
          useExisting: verifier,
        } as ExistingProvider),
    ),
  ]);
}
