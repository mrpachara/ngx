import {
  EnvironmentProviders,
  ExistingProvider,
  InjectionToken,
  Type,
  makeEnvironmentProviders,
} from '@angular/core';

import { JWT_VERIFIERS } from './tokens';
import { JwtVerifier } from './types';

/**
 * Provide JWT verifers for using globally.
 *
 * @param verifiers The verifier injection tokens or classes
 * @returns `EnvironmentProviders`
 */
export function provideJwtVerifiers(
  ...verifiers: (Type<JwtVerifier> | InjectionToken<JwtVerifier>)[]
): EnvironmentProviders {
  // ## FOR ##: making providers
  return makeEnvironmentProviders([
    verifiers.map(
      (verifier) =>
        ({
          provide: JWT_VERIFIERS,
          multi: true,
          useExisting: verifier,
        }) as ExistingProvider,
    ),
  ]);
}
