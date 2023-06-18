import {
  EnvironmentProviders,
  ExistingProvider,
  FactoryProvider,
  InjectionToken,
  Provider,
  Type,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

import { configAuthorizationCode } from './functions';
import { AuthorizationCodeService, Oauth2Client } from './services';
import { AUTHORIZATION_CODE_SERVICES } from './tokens';
import { AuthorizationCodeConfig, AuthorizationCodeFullConfig } from './types';

/**
 * Provide authorization code service and its features. For creating multiple
 * authorization code services, use `provideAuthorizationCode()` multiple times
 * with `withAuthorizationCodeProvider()` feature, e.g.:
 *
 * ```typescript
 * provideAuthorizationCode(configA),
 * provideAuthorizationCode(
 *   configB,
 *   withAuthorizationCodeProvider(
 *     AUTHORIZATION_CODE_SERVICE_B,
 *     (fullConfigB) =>
 *       new AuthorizationCodeService(fullConfigB, inject(OAUTH2_CLIENT_B)),
 *   ),
 * ),
 * ```
 *
 * @param config The configuration of service
 * @param features The provider features
 * @returns `EnvironmentProviders`
 */
export function provideAuthorizationCode(
  config: AuthorizationCodeConfig,
  ...features: AuthorizationCodeFeatures[]
): EnvironmentProviders {
  const fullConfig = configAuthorizationCode(config);

  const fullConfigToken = new InjectionToken<AuthorizationCodeFullConfig>(
    `authorization-code-full-config-${fullConfig.name}`,
    {
      providedIn: 'root',
      factory: () => fullConfig,
    },
  );

  // ## FOR ##: normalizing featrues
  const prodiverFeatures = features.filter(
    (feature): feature is AuthorizationCodeProviderFeature =>
      feature.kind ===
      AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature,
  );

  if (prodiverFeatures.length > 1) {
    throw new Error(
      'Only one accessTokenProvider feature is allowed for each AuthorizationCode!',
    );
  }

  if (prodiverFeatures.length === 0) {
    features.push(
      withAuthorizationCodeProvider(
        AuthorizationCodeService,
        (fullConfig) =>
          new AuthorizationCodeService(fullConfig, inject(Oauth2Client)),
      ),
    );
  }

  // ## FOR ##: AuthorizationCodeProviderFeature
  features
    .filter(
      (feature): feature is AuthorizationCodeProviderFeature =>
        feature.kind ===
        AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature,
    )
    .forEach((feature) => feature.assign(fullConfigToken));

  // ## FOR ##: making providers
  return makeEnvironmentProviders([
    features.map((feature) => feature.providers),
  ]);
}

export enum AuthorizationCodeFeatureKind {
  AuthorizationCodeProviderFeature,
}

export interface AuthorizationCodeFeature<
  K extends AuthorizationCodeFeatureKind,
> {
  readonly kind: K;
  readonly providers: Provider[];
}

/** Authorization code service provider feature */
export type AuthorizationCodeProviderFeature<
  T extends AuthorizationCodeService = AuthorizationCodeService,
> =
  AuthorizationCodeFeature<AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature> & {
    readonly token: Type<T> | InjectionToken<T>;
    readonly factory: (fullConfig: AuthorizationCodeFullConfig) => T;
    assign(fullConfigToken: InjectionToken<AuthorizationCodeFullConfig>): void;
  };

/**
 * Provide another `AuthorizationCodeService` than the default one.
 *
 * @param token The injection token or class to be used
 * @param factory The factory for creating instance
 * @returns `AuthorizationCodeProviderFeature`
 */
export function withAuthorizationCodeProvider<
  T extends AuthorizationCodeService,
>(
  token: Type<T> | InjectionToken<T>,
  factory: (fullConfig: AuthorizationCodeFullConfig) => T,
): AuthorizationCodeProviderFeature {
  return {
    kind: AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature,
    providers: [],
    token,
    factory,
    assign(fullConfigToken) {
      this.providers.splice(0);
      this.providers.push(
        {
          provide: this.token,
          useFactory: () => this.factory(inject(fullConfigToken)),
        } as FactoryProvider,
        {
          provide: AUTHORIZATION_CODE_SERVICES,
          useExisting: this.token,
        } as ExistingProvider,
      );
    },
  };
}

/** All authorization code features */
export type AuthorizationCodeFeatures = AuthorizationCodeProviderFeature;
