import { InjectionToken } from '@angular/core';

import { StateActionHandlers } from '../types';

export const STATE_ACTION_HANDLERS = new InjectionToken<StateActionHandlers>(
  'state-action-handlers',
);
