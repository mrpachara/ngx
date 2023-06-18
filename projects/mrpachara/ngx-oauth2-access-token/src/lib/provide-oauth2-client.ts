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

import { configOauth2Client } from './functions';
import { Oauth2Client } from './services';
import {
  DEFAULT_OAUTH2_CLIENT_ERROR_TRANSFORMER,
  OATUTH2_CLIENTS,
} from './tokens';
import {
  Oauth2ClientConfig,
  Oauth2ClientErrorTransformer,
  Oauth2ClientFullConfig,
} from './types';

/**
 * Provide OAuth 2.0 client and its features. For creating multiple OAuth 2.0
 * clients, use `provideOauth2Client()` multiple times with
 * `withOauth2ClientProvider()` feature, e.g.:
 *
 * ```typescript
 * provideOauth2Client(configA),
 * provideOauth2Client(
 *   configB,
 *   withOauth2ClientProvider(
 *     OAUTH2_CLIENT_B,
 *     (fullConfigB, errorTransformer) =>
 *       new Oauth2Client(fullConfigB, errorTransformer),
 *   ),
 * ),
 * ```
 *
 * @param config The configuration of service
 * @param features The provider features
 * @returns `EnvironmentProviders`
 */
export function provideOauth2Client(
  config: Oauth2ClientConfig,
  ...features: Oauth2ClientFeatures[]
): EnvironmentProviders {
  const fullConfig = configOauth2Client(config);

  const fullConfigToken = new InjectionToken<Oauth2ClientFullConfig>(
    `oauth2-client-full-config-${fullConfig.name}`,
    {
      providedIn: 'root',
      factory: () => fullConfig,
    },
  );

  const errorTransformerToken =
    new InjectionToken<Oauth2ClientErrorTransformer>(
      `oauth2-client-error-transformer-${fullConfig.name}`,
      {
        providedIn: 'root',
        factory: () => inject(DEFAULT_OAUTH2_CLIENT_ERROR_TRANSFORMER),
      },
    );

  // ## FOR ##: normalizing featrues
  const providerFeatures = features.filter(
    (feature): feature is Oauth2ClientProviderFeature =>
      feature.kind === Oauth2ClientFeatureKind.Oauth2ClientProviderFeature,
  );

  if (providerFeatures.length > 1) {
    throw new Error(
      'Only one accessTokenProvider feature is allowed for each Oauth2Client!',
    );
  }

  if (providerFeatures.length === 0) {
    features.push(
      withOauth2ClientProvider(
        Oauth2Client,
        (fullConfig, errorTransformer) =>
          new Oauth2Client(fullConfig, errorTransformer),
      ),
    );
  }

  // ## FOR ##: Oauth2ClientErrorTransformerFeature
  features
    .filter(
      (feature): feature is Oauth2ClientErrorTransformerFeature =>
        feature.kind ===
        Oauth2ClientFeatureKind.Oauth2ClientErrorTransformerFeature,
    )
    .forEach((feature) => feature.assign(errorTransformerToken));

  // ## FOR ##: Oauth2ClientProviderFeature
  features
    .filter(
      (feature): feature is Oauth2ClientProviderFeature =>
        feature.kind === Oauth2ClientFeatureKind.Oauth2ClientProviderFeature,
    )
    .forEach((feature) =>
      feature.assign(fullConfigToken, errorTransformerToken),
    );

  // ## FOR ##: making providers
  return makeEnvironmentProviders([
    features.map((feature) => feature.providers),
  ]);
}

export enum Oauth2ClientFeatureKind {
  Oauth2ClientProviderFeature,
  Oauth2ClientErrorTransformerFeature,
}

export interface Oauth2ClientFeature<K extends Oauth2ClientFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

/** OAuth 2.0 client provider feature */
export type Oauth2ClientProviderFeature<T extends Oauth2Client = Oauth2Client> =
  Oauth2ClientFeature<Oauth2ClientFeatureKind.Oauth2ClientProviderFeature> & {
    readonly token: Type<T> | InjectionToken<T>;
    readonly factory: (
      fullConfig: Oauth2ClientFullConfig,
      errorTransformer: Oauth2ClientErrorTransformer,
    ) => T;
    assign(
      fullConfigToken: InjectionToken<Oauth2ClientFullConfig>,
      errorTransformerToken: InjectionToken<Oauth2ClientErrorTransformer>,
    ): void;
  };

/**
 * Provide another `Oauth2Client` than the default one.
 *
 * @param token The injection token or class to be used
 * @param factory The factory for creating instance
 * @returns `Oauth2ClientProviderFeature`
 */
export function withOauth2ClientProvider<T extends Oauth2Client>(
  token: Type<T> | InjectionToken<T>,
  factory: (
    fullConfig: Oauth2ClientFullConfig,
    errorTransformer: Oauth2ClientErrorTransformer,
  ) => T,
): Oauth2ClientProviderFeature {
  return {
    kind: Oauth2ClientFeatureKind.Oauth2ClientProviderFeature,
    providers: [],
    token,
    factory,
    assign(fullConfigToken, errorTransformerToken) {
      this.providers.splice(0);
      this.providers.push(
        {
          provide: this.token,
          useFactory: () =>
            this.factory(
              inject(fullConfigToken),
              inject(errorTransformerToken),
            ),
        } as FactoryProvider,
        {
          provide: OATUTH2_CLIENTS,
          multi: true,
          useExisting: this.token,
        } as ExistingProvider,
      );
    },
  };
}

/** OAuth 2.0 client error transformer feature */
export type Oauth2ClientErrorTransformerFeature =
  Oauth2ClientFeature<Oauth2ClientFeatureKind.Oauth2ClientErrorTransformerFeature> & {
    readonly factory: () => Oauth2ClientErrorTransformer;
    assign(token: InjectionToken<Oauth2ClientErrorTransformer>): void;
  };

/**
 * Provide the local `Oauth2ClientErrorTransformer` instead of the default one.
 *
 * @param factory The factory for creating instance
 * @returns `Oauth2ClientErrorTransformerFeature`
 */
export function withOauth2ClientErrorTransformer(
  factory: () => Oauth2ClientErrorTransformer,
): Oauth2ClientErrorTransformerFeature {
  return {
    kind: Oauth2ClientFeatureKind.Oauth2ClientErrorTransformerFeature,
    providers: [],
    factory,
    assign(token) {
      this.providers.splice(0);
      this.providers.push({
        provide: token,
        useFactory: factory,
      } as FactoryProvider);
    },
  };
}

/** All OAuth 2.0 client features */
export type Oauth2ClientFeatures =
  | Oauth2ClientProviderFeature
  | Oauth2ClientErrorTransformerFeature;
