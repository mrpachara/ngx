import { Injectable, inject } from '@angular/core';
import { defer, Observable, of, throwError } from 'rxjs';

import { StateActionNotFoundError } from './errors';
import { STATE_ACTION_ERROR_HANDLER, STATE_ACTION_HANDLERS } from './tokens';
import {
  AccessTokenResponse,
  StateActionHandler,
  StateActionParams,
} from './types';
import { parseStateAction } from './functions';

@Injectable({ providedIn: 'root' })
export class StateActionService {
  private readonly handlers = inject(STATE_ACTION_HANDLERS);
  private readonly errorHandler = inject(STATE_ACTION_ERROR_HANDLER);

  dispatch<T>(
    accessToken: AccessTokenResponse,
    stateData: StateActionParams,
  ): Observable<T> {
    return defer(() => {
      const stateAction = stateData.action;

      if (!stateAction) {
        return of(undefined as T);
      }

      const { action, data } = parseStateAction(stateAction);

      if (typeof this.handlers[action] !== 'function') {
        return throwError(() => new StateActionNotFoundError(action));
      }

      return (this.handlers[action] as StateActionHandler<T>)(
        accessToken,
        data,
        stateData,
      );
    });
  }

  handerError(err: unknown, stateData: StateActionParams | null): void {
    this.errorHandler(err, stateData);
  }
}
