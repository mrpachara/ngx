import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, defer, switchMap, throwError } from 'rxjs';
import { AccessTokenNotFoundError } from '../errors';
import { AccessTokenService } from '../services';
import {
  OAT_REQUEST,
  WITH_ACCESS_TOKEN,
  injectAccessTokenService,
} from '../tokens';

const defaultAccessTokenParamName = 'access_token';

// TODO: Add unit tests for this interceptor, but it is not easy to test because of the use of `inject` function. Consider refactoring to make it more testable.

/**
 * Create interceptor for assigning _access token_ to request determined by
 * using `WITH_ACCESS_TOKEN` `HttpContext`.
 *
 * @param inParams If it is provided in `HttpClient.params`, default `false`.
 *   Assign a `string` to be the parameter name.
 * @returns
 */
export function createAssignAccessTokenInterceptor(
  inParams: boolean | string = false,
) {
  return (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ): Observable<HttpEvent<unknown>> => {
    const token = req.context.get(WITH_ACCESS_TOKEN);

    if (token && !req.context.get(OAT_REQUEST)) {
      const service =
        token === true
          ? inject(AccessTokenService)
          : injectAccessTokenService(token);

      return defer(async () => await service.loadAccessTokenInfo()).pipe(
        switchMap((info) => {
          if (info === null) {
            return throwError(() => new AccessTokenNotFoundError(service.id));
          }

          return next(
            req.clone(
              inParams === false
                ? {
                    headers: req.headers.set(
                      'Authorization',
                      `${info.type} ${info.token}`,
                    ),
                  }
                : {
                    params: req.params.set(
                      inParams === true || inParams.trim() === ''
                        ? defaultAccessTokenParamName
                        : inParams.trim(),
                      info.token,
                    ),
                  },
            ),
          );
        }),
      );
    } else {
      return next(req);
    }
  };
}
