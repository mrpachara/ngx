import {
  EnvironmentProviders,
  Provider,
  makeEnvironmentProviders,
} from '@angular/core';

import { STATE_ACTION_ERROR_HANDLER, STATE_ACTION_HANDLERS } from './tokens';
import {
  StateAction,
  StateActionErrorHandler,
  StateActionHandler,
  StateActionInfo,
} from './types';

/**
 * Provide state action and state action error handlers.
 *
 * @param features The provider features
 * @returns `EnvironmentProviders`
 */
export function provideStateAction(
  ...features: StateActionFeatures[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    features.map((feature) => feature.providers),
  ]);
}

export enum StateActionFeatureKind {
  StateActionHandlerFeature,
  StateActionErrorHandlerFeature,
}

export interface StateActionFeature<K extends StateActionFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

/** State action handler feature */
export type StateActionHandlerFeature =
  StateActionFeature<StateActionFeatureKind.StateActionHandlerFeature>;

/**
 * Provide state action hander. You can define `SteteActionInfo` first. Then use
 * the defined `SteteActionInfo` with this feature, e.g.:
 *
 * ```typescript
 * type MyAction = StatActionInfo<'my_action', {
 *   a: sting;
 *   b?: number;
 *   c: boolean;
 * }>;
 *
 * // in app.conf.ts providers
 *
 * provideStateAction(
 *   withStateActionHandler<MyAction>(
 *     'my_action',
 *     () => {
 *       // inject required services if needed
 *       return (accessTokenResponse, stateData) => {
 *         // The type of accessTokenResponse and stateData can be infered correctly.
 *       };
 *     }),
 *   ),
 * ),
 * ```
 *
 * @param name The name of state action
 * @param factory The factory for creating instance
 * @returns `StateActionHandlerFeature`
 */
export function withStateActionHandler<I extends StateActionInfo>(
  name: I['name'],
  factory: () => StateActionHandler<StateAction<I>, unknown>,
): StateActionHandlerFeature {
  return {
    kind: StateActionFeatureKind.StateActionHandlerFeature,
    providers: [
      {
        provide: STATE_ACTION_HANDLERS,
        useFactory: () => [name, factory()] as const,
        multi: true,
      },
    ],
  };
}

/** State action error hander feature */
export type StateActionErrorHandlerFeature =
  StateActionFeature<StateActionFeatureKind.StateActionErrorHandlerFeature>;

/**
 * Provide state action error hander.
 *
 * @param factory The factory for creating instance
 * @returns `StateActionErrorHandlerFeature`
 */
export function withStateActionErrorHandler(
  factory: () => StateActionErrorHandler,
): StateActionErrorHandlerFeature {
  return {
    kind: StateActionFeatureKind.StateActionErrorHandlerFeature,
    providers: [{ provide: STATE_ACTION_ERROR_HANDLER, useFactory: factory }],
  };
}

/** All state action features */
export type StateActionFeatures =
  | StateActionHandlerFeature
  | StateActionErrorHandlerFeature;
