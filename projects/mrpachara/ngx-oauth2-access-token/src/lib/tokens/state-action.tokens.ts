import { InjectionToken } from '@angular/core';

import { StateActionErrorHandler, StateActionHandlers } from '../types';

export const STATE_ACTION_HANDLERS = new InjectionToken<StateActionHandlers>(
  'state-action-handlers',
);

export const STATE_ACTION_ERROR_HANDLER =
  new InjectionToken<StateActionErrorHandler>('state-action-error-handler', {
    providedIn: 'root',
    factory: () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    },
  });
