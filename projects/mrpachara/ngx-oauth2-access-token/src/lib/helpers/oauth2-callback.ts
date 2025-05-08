import {
  catchError,
  defer,
  from,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';

import {
  BadResponseCallbackError,
  CallbackError,
  ErrorResponseCallbackError,
} from '../errors';
import { AuthorizationCodeService, StateActionService } from '../services';

/**
 * The processes of authorization code callback URL.
 *
 * 1. Get authorization code and other inforamtion
 * 2. Verify state data
 * 3. Exchange authorization code for access token
 * 4. Handle state action to perform access token response task
 *
 * @param stateId The state ID
 * @param code The authorization code
 * @param error The error from authorization code server
 * @param error_description The error description from authorization code server
 * @param authorizationCodeService The authorization code service
 * @param stateActionService The state action service
 * @returns The `Observable` of the returned value from the handler
 * @throws `ErrorResponseCallbackError` when authorization code server return
 *   error
 * @throws `BadResponseCallbackError` when authorization code server return
 *   invalid information
 */
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
          : Promise.resolve(null),
      ).pipe(
        switchMap((stateData) =>
          throwError(() => {
            return new ErrorResponseCallbackError({
              ...{ error },
              ...(error_description ? { error_description } : {}),
              ...(stateData ? { stateData } : {}),
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
      return from(authorizationCodeService.clearState(stateId)).pipe(
        switchMap((stateData) => {
          return throwError(
            () =>
              new BadResponseCallbackError(
                `The 'code' is required for callback. No 'code' was replied from oauth server in query string.`,
                stateData ?? undefined,
              ),
          );
        }),
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
    switchMap(({ accessTokenResponse, stateData }) => {
      return stateActionService.dispatch(accessTokenResponse, stateData);
    }),
    catchError((err) => {
      const stateData =
        err instanceof CallbackError && typeof err.cause.stateData === 'object'
          ? err.cause.stateData
          : null;

      return of(stateActionService.handleError(err, stateData)).pipe(
        switchMap(() => throwError(() => err)),
      );
    }),
  );
}
