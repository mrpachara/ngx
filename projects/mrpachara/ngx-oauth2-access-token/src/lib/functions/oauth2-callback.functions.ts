import { ParamMap } from '@angular/router';
import { defer, map, Observable, of, switchMap, throwError } from 'rxjs';

import { AuthorizationCodeService } from '../authorization-code.service';
import {
  BadResponseCallbackError,
  ErrorResponseCallbackError,
} from '../errors';
import { StateActionService } from '../state-action.service';

export function oauth2Callback(
  queryParamMap: ParamMap,
  authorizationCodeService: AuthorizationCodeService,
  stateActionService: StateActionService,
): Observable<unknown> {
  return defer(() => {
    const stateId = queryParamMap.get('state');

    if (stateId === null) {
      return throwError(
        () =>
          new BadResponseCallbackError(
            `The 'state' is required for callback. The oauth2 server must reply with 'state' query string.`,
          ),
      );
    }

    return of(stateId);
  }).pipe(
    switchMap((stateId) => {
      return authorizationCodeService
        .verifyState(stateId)
        .pipe(map((stateData) => ({ stateId, stateData })));
    }),
    switchMap(({ stateId, stateData }) => {
      if (queryParamMap.has('error')) {
        return authorizationCodeService.clearState(stateId).pipe(
          switchMap(() =>
            throwError(() => {
              const error = queryParamMap.get('error');
              const error_description = queryParamMap.get('error_description');
              return new ErrorResponseCallbackError({
                ...(error ? { error } : {}),
                ...(error_description ? { error_description } : {}),
              });
            }),
          ),
        );
      }

      const code = queryParamMap.get('code');

      if (code === null) {
        return throwError(
          () =>
            new BadResponseCallbackError(
              `The 'code' is required for callback. No 'code' was replied from oauth server in query string.`,
            ),
        );
      }

      return authorizationCodeService
        .exchangeAuthorizationCode(stateId, stateData, code)
        .pipe(map((accessToken) => ({ stateData, accessToken })));
    }),
    switchMap(({ stateData, accessToken }) =>
      stateActionService.dispatch(stateData, accessToken),
    ),
  );
}
