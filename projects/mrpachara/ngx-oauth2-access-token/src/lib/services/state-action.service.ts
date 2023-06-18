import { Injectable, inject } from '@angular/core';
import { defer, Observable, ObservableInput, throwError } from 'rxjs';

import { StateActionNotFoundError } from '../errors';
import { isStateActionProvided } from '../functions';
import { STATE_ACTION_ERROR_HANDLER, STATE_ACTION_HANDLERS } from '../tokens';
import {
  AccessTokenResponse,
  StateAction,
  StateActionHandler,
  StateActionHandlers,
} from '../types';

/** State action service */
@Injectable({
  providedIn: 'root',
})
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

  /**
   * Dispatch access token response and state data to handlers.
   *
   * @param accessToken The access token response to be dispatched
   * @param stateData The state data to be dispatched
   * @returns The `Observable` of `R` or `void` when state action is not
   *   provided.
   */
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

  /**
   * Handle the given error.
   *
   * @param err The error for handling
   * @param stateData The state data for handling if can be provided
   * @returns The `ObservableInput` of `void`
   */
  handleError(
    err: unknown,
    stateData: StateAction | null,
  ): ObservableInput<void> {
    return this.errorHandler(err, stateData);
  }
}
