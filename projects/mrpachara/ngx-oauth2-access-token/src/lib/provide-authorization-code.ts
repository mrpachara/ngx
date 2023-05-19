import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import {
  AuthorizationCodeConfig,
  AuthorizationCodeFullConfig,
  PickOptional,
} from './types';
import { AUTHORIZATION_CODE_FULL_CONFIG } from './tokens';

const defaultStateTTL = 10 * 60 * 1000;
const defaultCodeVerifierLength = 56;

const defaultConfig: PickOptional<AuthorizationCodeConfig> = {
  debug: false,
  pkce: 'none',
  stateTTL: defaultStateTTL,
  codeVerifierLength: defaultCodeVerifierLength,
  additionalParams: {},
};

export function provideAuthorizationCode(
  config: AuthorizationCodeConfig,
): EnvironmentProviders {
  const fullConfig: AuthorizationCodeFullConfig = {
    ...defaultConfig,
    ...config,
  };

  return makeEnvironmentProviders([
    { provide: AUTHORIZATION_CODE_FULL_CONFIG, useValue: fullConfig },
  ]);
}
