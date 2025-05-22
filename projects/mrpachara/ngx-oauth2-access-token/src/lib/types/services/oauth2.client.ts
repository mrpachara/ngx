import { HttpErrorResponse } from '@angular/common/http';
import { Oauth2ErrorResponse } from '../standard';

/** OAuth 2.0 error response transformer function */
export type Oauth2ClientErrorTransformer = (
  err: HttpErrorResponse,
) => Required<Oauth2ErrorResponse>;
