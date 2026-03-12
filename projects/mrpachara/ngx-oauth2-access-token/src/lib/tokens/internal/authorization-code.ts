import { InjectionToken } from '@angular/core';
import { AuthorizationCodeService } from '../../services';
import { AuthorizationCodeConfig, StateStorage } from '../../types';
import { IdKey } from '../common';

/** The injection token for authorization-code service config */
export const AUTHORIZATION_CODE_CONFIG =
  new InjectionToken<AuthorizationCodeConfig>('authorization-code-config');

/** The injection token for authorization-code storage */
export const AUTHORIZATION_CODE_STORAGE = new InjectionToken<StateStorage>(
  'authorization-code-storage',
);

/** The injection token for authorization code tokens */
export const AUTHORIZATION_CODE_SERVICE_TOKENS = new InjectionToken<
  {
    readonly id: IdKey;
    readonly token: InjectionToken<AuthorizationCodeService>;
  }[]
>('authorization-code-tokens', {
  providedIn: 'root',
  factory: () => [],
});

/** The injection token for authorization code hierarchized tokens */
export const AUTHORIZATION_CODE_SERVICE_HIERARCHIZED_TOKENS =
  new InjectionToken<
    {
      readonly id: IdKey;
      readonly token: InjectionToken<AuthorizationCodeService>;
    }[]
  >('authorization-code-hierarachized-tokens', {
    providedIn: 'root',
    factory: () => [],
  });
