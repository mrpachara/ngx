import { ActivatedRoute } from '@angular/router';
import { defer, map, Observable, of, switchMap, throwError } from 'rxjs';

import { AuthorizationCodeService } from '../authorization-code.service';
import { BadRequestCallbackError } from '../errors';
import { StateActionService } from '../state-action.service';

export function oauth2Callback(
  route: ActivatedRoute,
  authorizationCodeService: AuthorizationCodeService,
  stateActionService: StateActionService,
): Observable<any> {
  const queryParamMap = route.snapshot.queryParamMap;

  return defer(() => {
    const stateId = queryParamMap.get('state');

    if (stateId === null) {
      return throwError(
        () =>
          new BadRequestCallbackError(
            `The 'state' is required for callback. The oauth2 server must reply with 'state' query string.`,
          ),
      );
    }

    return of(stateId);
  }).pipe(
    switchMap((stateId) => {
      return authorizationCodeService
        .verifyState(stateId)
        .pipe(map((stateData) => [stateId, stateData] as const));
    }),
    switchMap(([stateId, stateData]) => {
      if (queryParamMap.has('error')) {
        const errorObject = {
          error: queryParamMap.get('error'),
          error_description: queryParamMap.get('error_description'),
        };

        if (queryParamMap.get('error') === 'access_denied') {
          return authorizationCodeService
            .clearState(stateId)
            .pipe(switchMap(() => throwError(() => errorObject)));
        }

        return throwError(() => errorObject);
      }

      const code = queryParamMap.get('code');

      if (code === null) {
        return throwError(
          () =>
            new BadRequestCallbackError(
              `The 'code' is required for callback. No 'code' was replied from oauth server in query string.`,
            ),
        );
      }

      return authorizationCodeService
        .exchangeAuthorizationCode(stateId, stateData, code)
        .pipe(map((accessToken) => [stateData, accessToken] as const));
    }),
    switchMap(([stateData, accessToken]) =>
      stateActionService.dispatch(stateData, accessToken),
    ),
  );
}
