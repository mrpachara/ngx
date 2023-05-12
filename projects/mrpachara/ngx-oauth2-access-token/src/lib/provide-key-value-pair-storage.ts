import {
  EnvironmentProviders,
  Type,
  makeEnvironmentProviders,
} from '@angular/core';
import { KEY_VALUE_PAIR_STORAGE } from './tokens';
import { LocalStorage } from './storage/local-storage/local.storage';
import { KeyValuePairStorage } from './types';

export function provideKeyValuePairStorage(
  usedClass?: Type<KeyValuePairStorage>,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: KEY_VALUE_PAIR_STORAGE,
      useClass: typeof usedClass === 'undefined' ? LocalStorage : usedClass,
    },
  ]);
}
