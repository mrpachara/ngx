import { InjectionToken } from '@angular/core';

import { StateActionErrorHandler, StateActionHandler } from '../types';

export const STATE_ACTION_HANDLERS = new InjectionToken<
  [string, StateActionHandler][]
>('state-action-handlers', { providedIn: 'root', factory: () => [] });

export const STATE_ACTION_ERROR_HANDLER =
  new InjectionToken<StateActionErrorHandler>('state-action-error-handler', {
    providedIn: 'root',
    factory: () => {
      return () => {
        // empty function
      };
    },
  });
