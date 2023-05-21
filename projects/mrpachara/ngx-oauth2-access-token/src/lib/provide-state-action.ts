import {
  EnvironmentProviders,
  Provider,
  makeEnvironmentProviders,
} from '@angular/core';

import { StateActionErrorHandler, StateActionHandlers } from './types';
import { STATE_ACTION_ERROR_HANDLER, STATE_ACTION_HANDLERS } from './tokens';

export function provideStateAction(
  handlers: StateActionHandlers | (() => StateActionHandlers),
  ...features: StateActionFeatures[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: STATE_ACTION_HANDLERS,
      ...(typeof handlers === 'function'
        ? {
            useFactory: handlers,
          }
        : {
            useValue: handlers,
          }),
    },
    features.map((feature) => feature.providers),
  ]);
}

export enum StateActionFeatureKind {
  ErrorHandlerFeature,
}

export interface StateActionFeature<K extends StateActionFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type ErrorHandlerFeature =
  StateActionFeature<StateActionFeatureKind.ErrorHandlerFeature>;

export type StateActionFeatures = ErrorHandlerFeature;

export function withErrorHandler(
  errorHandlerFactory: () => StateActionErrorHandler,
): ErrorHandlerFeature {
  return {
    kind: StateActionFeatureKind.ErrorHandlerFeature,
    providers: [
      { provide: STATE_ACTION_ERROR_HANDLER, useFactory: errorHandlerFactory },
    ],
  };
}
