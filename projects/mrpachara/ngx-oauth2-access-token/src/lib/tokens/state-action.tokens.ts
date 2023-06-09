import { InjectionToken } from '@angular/core';

import { StateActionErrorHandler, StateActionHandler } from '../types';

export const STATE_ACTION_HANDLERS = new InjectionToken<
  [string, StateActionHandler][]
>('state-action-handlers', { providedIn: 'root', factory: () => [] });

/** The injection token for state action error handler */
export const STATE_ACTION_ERROR_HANDLER =
  new InjectionToken<StateActionErrorHandler>('state-action-error-handler', {
    providedIn: 'root',
    factory: () => {
      return async () => {
        // empty function
      };
    },
  });
