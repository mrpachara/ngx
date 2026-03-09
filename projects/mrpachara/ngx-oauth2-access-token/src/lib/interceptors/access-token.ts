import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, Observable, switchMap, throwError } from 'rxjs';
import { AccessTokenNotFoundError } from '../errors';
import { AccessTokenService } from '../services';
import {
  injectAccessTokenService,
  OAT_REQUEST,
  WITH_ACCESS_TOKEN,
} from '../tokens';

export function assignAccessTokenInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
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
          req.clone({
            headers: req.headers.set(
              'Authorization',
              `${info.type} ${info.token}`,
            ),
          }),
        );
      }),
    );
  } else {
    return next(req);
  }
}
