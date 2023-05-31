import {
  EnvironmentProviders,
  Provider,
  makeEnvironmentProviders,
} from '@angular/core';

import {
  StateAction,
  StateActionErrorHandler,
  StateActionHandler,
  StateActionInfo,
} from './types';
import { STATE_ACTION_ERROR_HANDLER, STATE_ACTION_HANDLERS } from './tokens';

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

export type StateActionHandlerFeature =
  StateActionFeature<StateActionFeatureKind.StateActionHandlerFeature>;

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

type MyActionInfo = StateActionInfo<
  'my_action',
  { a: string; b: number; c?: boolean }
>;

withStateActionHandler<MyActionInfo>(
  'my_action',
  () => async (accessTokenResponse, stateData) => {
    console.log(accessTokenResponse);
    stateData.action.data;
  },
);

export type StateActionErrorHandlerFeature =
  StateActionFeature<StateActionFeatureKind.StateActionErrorHandlerFeature>;

export function withStateActionErrorHandler(
  factory: () => StateActionErrorHandler,
): StateActionErrorHandlerFeature {
  return {
    kind: StateActionFeatureKind.StateActionErrorHandlerFeature,
    providers: [{ provide: STATE_ACTION_ERROR_HANDLER, useFactory: factory }],
  };
}

export type StateActionFeatures =
  | StateActionHandlerFeature
  | StateActionErrorHandlerFeature;
