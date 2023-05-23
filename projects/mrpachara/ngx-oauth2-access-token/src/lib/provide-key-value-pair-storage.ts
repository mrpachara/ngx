import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { KEY_VALUE_PAIR_STORAGE } from './tokens';
import { KeyValuePairStorage } from './types';

export function provideKeyValuePairStorage(
  factory: () => KeyValuePairStorage,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: KEY_VALUE_PAIR_STORAGE,
      useFactory: factory,
    },
  ]);
}
