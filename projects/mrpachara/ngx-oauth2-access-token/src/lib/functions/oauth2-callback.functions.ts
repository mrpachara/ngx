import { defer, from, Observable, of, switchMap, throwError } from 'rxjs';

import { AuthorizationCodeService } from '../authorization-code.service';
import {
  BadResponseCallbackError,
  ErrorResponseCallbackError,
} from '../errors';
import { StateActionService } from '../state-action.service';

export function oauth2Callback(
  stateId: string | null,
  code: string | null,
  error: string | null,
  error_description: string | null,
  authorizationCodeService: AuthorizationCodeService,
  stateActionService: StateActionService,
): Observable<unknown> {
  return defer(() => {
    // NOTE: In the case of error, server may return without stateId. So check it first.
    if (error !== null) {
      return from(
        stateId
          ? authorizationCodeService.clearState(stateId)
          : new Promise<void>((resolve) => resolve()),
      ).pipe(
        switchMap(() =>
          throwError(() => {
            return new ErrorResponseCallbackError({
              ...{ error },
              ...(error_description ? { error_description } : {}),
            });
          }),
        ),
      );
    }

    if (stateId === null) {
      return throwError(
        () =>
          new BadResponseCallbackError(
            `The 'state' is required for callback. The oauth2 server must reply with 'state' query string.`,
          ),
      );
    }

    if (code === null) {
      return throwError(
        () =>
          new BadResponseCallbackError(
            `The 'code' is required for callback. No 'code' was replied from oauth server in query string.`,
          ),
      );
    }

    return of({
      stateId,
      code,
    });
  }).pipe(
    switchMap(({ stateId, code }) => {
      return authorizationCodeService.exchangeAuthorizationCode(stateId, code);
    }),
    switchMap(({ accessToken, stateData }) =>
      stateActionService.dispatch(stateData, accessToken),
    ),
  );
}
