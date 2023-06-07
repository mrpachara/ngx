import { Injectable, inject } from '@angular/core';
import { defer, Observable, throwError } from 'rxjs';

import { StateActionNotFoundError } from '../errors';
import { isStateActionProvided } from '../functions';
import { STATE_ACTION_ERROR_HANDLER, STATE_ACTION_HANDLERS } from '../tokens';
import {
  AccessTokenResponse,
  StateAction,
  StateActionHandler,
  StateActionHandlers,
} from '../types';

@Injectable({ providedIn: 'root' })
export class StateActionService {
  private readonly handlerEntries = inject(STATE_ACTION_HANDLERS);
  private readonly errorHandler = inject(STATE_ACTION_ERROR_HANDLER);

  private handlers: StateActionHandlers;

  constructor() {
    this.handlers = this.handlerEntries.reduce((carry, entry) => {
      carry[entry[0]] = entry[1];
      return carry;
    }, {} as StateActionHandlers);
  }

  dispatch<S extends StateAction, R>(
    accessToken: AccessTokenResponse,
    stateData: S,
  ): Observable<void | R> {
    return defer(() => {
      if (!isStateActionProvided(stateData)) {
        return Promise.resolve();
      }

      const name = stateData.action.name;

      if (typeof this.handlers[name] !== 'function') {
        return throwError(() => new StateActionNotFoundError(name));
      }

      return (this.handlers[stateData.action.name] as StateActionHandler<S, R>)(
        accessToken,
        stateData,
      );
    });
  }

  handerError(err: unknown, stateData: StateAction | null): void {
    this.errorHandler(err, stateData);
  }
}
