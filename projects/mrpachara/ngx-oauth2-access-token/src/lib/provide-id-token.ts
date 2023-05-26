import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { IdTokenService } from './id-token.service';
import { IdTokenConfig, IdTokenFullConfig, PickOptional } from './types';
import {
  ACCESS_TOKEN_RESPONSE_LISTENERS,
  ID_TOKEN_FULL_CONFIG,
} from './tokens';

const defaultConfig: PickOptional<IdTokenConfig> = {
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
      provide: ACCESS_TOKEN_RESPONSE_LISTENERS,
      multi: true,
      useExisting: IdTokenService,
    },
  ]);
}
