import {
  BadResponseCallbackError,
  ErrorResponseCallbackError,
} from '../errors';
import { AuthorizationCodeService } from '../services';

/**
 * The processes of authorization code callback URL.
 *
 * 1. Get authorization code and other inforamtion
 * 2. Verify state data
 * 3. Exchange authorization code for access token
 * 4. Return state data
 *
 * @param state The state
 * @param code The authorization code
 * @param error The error from authorization code server
 * @param error_description The error description from authorization code server
 * @param authorizationCodeService The authorization code service
 * @returns The `Promise` of state data
 * @throws `ErrorResponseCallbackError` when authorization code server return
 *   error
 * @throws `BadResponseCallbackError` when authorization code server return
 *   invalid information
 */
export async function authorizationCodeCallback<T>(
  state: string | undefined,
  code: string | undefined,
  error: string | undefined,
  error_description: string | undefined,
  authorizationCodeService: AuthorizationCodeService,
): Promise<T> {
  // NOTE: In the case of error, server may return without stateId. So check it first.
  if (typeof error !== 'undefined') {
    const stateData = state
      ? await authorizationCodeService.clearState<T>(state)
      : undefined;

    throw new ErrorResponseCallbackError({
      error,
      ...(error_description ? { error_description } : {}),
      ...(stateData ? { stateData } : {}),
    });
  }

  if (typeof state === 'undefined') {
    throw new BadResponseCallbackError(
      `The 'state' is required for callback. The oauth2 server must reply with 'state' query string.`,
    );
  }

  if (typeof code === 'undefined') {
    const stateData = await authorizationCodeService.clearState<T>(state);

    throw new BadResponseCallbackError(
      `The 'code' is required for callback. No 'code' was replied from oauth server in query string.`,
      stateData ?? undefined,
    );
  }

  return await authorizationCodeService.exchangeCode<T>(state, code);
}
