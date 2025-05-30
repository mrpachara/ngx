import { inject, Injector, Provider } from '@angular/core';
import { libPrefix } from '../predefined';
import { AccessTokenService, AuthorizationCodeService } from '../services';
import { StateIndexedDbStorage } from '../storages/indexed-db/state-indexed-db.storage';
import {
  AUTHORIZATION_CODE_CONFIG,
  AUTHORIZATION_CODE_SERVICES,
  AUTHORIZATION_CODE_STORAGE,
  STORAGE_NAME,
} from '../tokens';
import { AuthorizationCodeConfig, StateStorage } from '../types';
import {
  AccessTokenExtensionFeature,
  AccessTokenFeatureKind,
} from './access-token';

/**
 * Provide authorization-code.
 *
 * @param config
 * @param featrues
 * @returns
 */
export function withAuthorizationCode(
  config: AuthorizationCodeConfig,
  ...features: AuthorizationCodeFeature[]
): AccessTokenExtensionFeature {
  return {
    kind: AccessTokenFeatureKind.AccessTokenExtensionFeature,
    internal: false,
    providers: (token) => [
      {
        provide: AUTHORIZATION_CODE_SERVICES,
        multi: true,
        useFactory: () =>
          Injector.create({
            name: `${libPrefix}-authorization-code-internal-injector`,
            parent: inject(Injector),
            providers: [
              {
                provide: AUTHORIZATION_CODE_CONFIG,
                useValue: config,
              },
              {
                provide: STORAGE_NAME,
                useFactory: () => inject(token).name,
              },
              {
                provide: AUTHORIZATION_CODE_STORAGE,
                useClass: StateIndexedDbStorage,
              },
              {
                provide: AccessTokenService,
                useExisting: token,
              },
              features.map((feature) => feature.providers),
              AuthorizationCodeService,
            ],
          }).get(AuthorizationCodeService),
      },
    ],
  };
}

// ------------- Avaliable Features -----------------
export type AuthorizationCodeFeature = AuthorizationCodeStorageFeature;

// ------------- Enum -----------------
export enum AuthorizationCodeFeatureKind {
  AuthorizationCodeStorageFeature = 'AUTHORIZATION_CODE:AUTHORIZATION_CODE_STORAGE_FEATURE',
}

// ------------- Type -----------------
export interface AuthorizationCodeFeatureType<
  K extends AuthorizationCodeFeatureKind,
> {
  readonly kind: K;
  readonly providers: readonly Provider[];
}
// ------------- Features -----------------
export type AuthorizationCodeStorageFeature =
  AuthorizationCodeFeatureType<AuthorizationCodeFeatureKind.AuthorizationCodeStorageFeature>;

// ------------- Feature Functions -----------------
/**
 * Provide authorization-code storage.
 *
 * @param factory
 * @returns
 */
export function withAuthorizationCodeStorage(
  factory: () => StateStorage,
): AuthorizationCodeStorageFeature {
  return {
    kind: AuthorizationCodeFeatureKind.AuthorizationCodeStorageFeature,
    providers: [
      {
        provide: AUTHORIZATION_CODE_STORAGE,
        useFactory: factory,
      },
    ],
  };
}
