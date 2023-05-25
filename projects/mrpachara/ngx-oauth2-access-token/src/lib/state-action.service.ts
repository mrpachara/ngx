import { Injectable, Injector, inject } from '@angular/core';
import { defer, Observable, of, throwError } from 'rxjs';

import { StateActionNotFoundError } from './errors';
import { STATE_ACTION_ERROR_HANDLER, STATE_ACTION_HANDLERS } from './tokens';
import {
  AccessToken,
  StateActionErrorHandler,
  StateActionHandler,
  StateActionHandlers,
  StateActionParams,
} from './types';
import { parseStateAction } from './functions';

@Injectable({ providedIn: 'root' })
export class StateActionService {
  private readonly injector = inject(Injector);

  // NOTE: for preventing circular reference, set handlers if needed
  private _handlers: StateActionHandlers | null = null;
  private get handlers() {
    if (this._handlers === null) {
      this._handlers = this.injector.get(STATE_ACTION_HANDLERS);
    }

    return this._handlers;
  }

  private _errorHandler: StateActionErrorHandler | null = null;
  private get errorHandler() {
    if (this._errorHandler === null) {
      this._errorHandler = this.injector.get(STATE_ACTION_ERROR_HANDLER);
    }

    return this._errorHandler;
  }

  dispatch<T>(
    accessToken: AccessToken,
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
