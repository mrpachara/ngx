import {
  EnvironmentProviders,
  ExistingProvider,
  InjectionToken,
  Type,
  makeEnvironmentProviders,
} from '@angular/core';
import { JwtVerifier } from '@mrpachara/ngx-oauth2-access-token';
import { JWT_VERIFIERS } from './tokens';

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
