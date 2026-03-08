import { inject, InjectionToken, Injector, Provider } from '@angular/core';
import { AccessTokenService, AuthorizationCodeService } from '../services';
import { StateIndexedDbStorage } from '../storages';
import {
  AUTHORIZATION_CODE_CONFIG,
  AUTHORIZATION_CODE_SERVICE_HIERARCHIZED_TOKENS,
  AUTHORIZATION_CODE_SERVICE_TOKENS,
  AUTHORIZATION_CODE_STORAGE,
  provideHierarchization,
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
    providers: ({ accessTokenServiceToken }) => {
      const token = new InjectionToken<AuthorizationCodeService>(
        `${accessTokenServiceToken}:authorization-code`,
      );

      return [
        {
          provide: token,
          useFactory: () =>
            Injector.create({
              name: `${token}:internal`,
              parent: inject(Injector),
              providers: [
                {
                  provide: AccessTokenService,
                  useExisting: accessTokenServiceToken,
                },
                {
                  provide: AUTHORIZATION_CODE_CONFIG,
                  useValue: config,
                },
                {
                  provide: STORAGE_NAME,
                  useFactory: () => `${inject(accessTokenServiceToken).id}`,
                },
                {
                  provide: AUTHORIZATION_CODE_STORAGE,
                  useClass: StateIndexedDbStorage,
                },
                features.map((feature) => feature.providers),
                AuthorizationCodeService,
              ],
            }).get(AuthorizationCodeService),
        },
        provideHierarchization(
          AUTHORIZATION_CODE_SERVICE_HIERARCHIZED_TOKENS,
          AUTHORIZATION_CODE_SERVICE_TOKENS,
          () => ({
            id: inject(accessTokenServiceToken).id,
            token,
          }),
        ),
        {
          provide: AuthorizationCodeService,
          useExisting: token,
        },
      ];
    },
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
