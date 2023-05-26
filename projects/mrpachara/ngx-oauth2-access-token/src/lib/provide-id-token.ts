import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { IdTokenService } from './id-token.service';
import { IdTokenConfig, IdTokenFullConfig, PickOptional } from './types';
import { ID_TOKEN_FULL_CONFIG, TOKEN_RESPONSE_LISTENERS } from './tokens';

const defaultConfig: PickOptional<Omit<IdTokenConfig, 'jwksUrl'>> = {
  debug: false,
  providedInAccessToken: false,
};

export function provideIdToken(config: IdTokenConfig): EnvironmentProviders {
  const fullConfig: IdTokenFullConfig = {
    ...defaultConfig,
    ...config,
  };

  return makeEnvironmentProviders([
    { provide: ID_TOKEN_FULL_CONFIG, useValue: fullConfig },
    {
      provide: TOKEN_RESPONSE_LISTENERS,
      multi: true,
      useExisting: IdTokenService,
    },
  ]);
}
