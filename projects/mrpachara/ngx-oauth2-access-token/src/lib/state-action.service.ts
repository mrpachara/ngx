import { Inject, Injectable } from '@angular/core';
import { defer, from, Observable, of, throwError } from 'rxjs';

import { StateActionNotFoundError } from './errors';
import { STATE_ACTION_HANDLERS } from './tokens';
import { AccessToken, StateAction, StateActionHandlers } from './types';

@Injectable({ providedIn: 'root' })
export class StateActionService {
  private readonly extract = (actionValue: string) => actionValue.split(':', 2);

  private readonly handlers: StateActionHandlers;
  constructor(
    @Inject(STATE_ACTION_HANDLERS)
    handlers: StateActionHandlers,
  ) {
    this.handlers = { ...handlers };
  }

  dispatch(
    stateAction: StateAction,
    accessToken: AccessToken,
  ): Observable<unknown> {
    if (!stateAction.action) {
      return of(false);
    }

    const [action, value] = this.extract(stateAction.action);

    return defer(() => {
      if (!this.handlers[action]) {
        return throwError(() => new StateActionNotFoundError(action));
      }

      const result = this.handlers[action](value, accessToken);

      if (result === undefined) {
        return of(true);
      } else if (result instanceof Promise) {
        return from(result);
      } else if (result instanceof Observable) {
        return result;
      } else {
        return of(result);
      }
    });
  }
}
