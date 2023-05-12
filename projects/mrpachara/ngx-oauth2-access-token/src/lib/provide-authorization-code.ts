import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AuthorizationCodeConfig } from './types';
import { AUTHORIZATION_CODE_CONFIG } from './tokens';

export function provideAuthorizationCode(
  config: AuthorizationCodeConfig,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AUTHORIZATION_CODE_CONFIG, useValue: config },
  ]);
}
