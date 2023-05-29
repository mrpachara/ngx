import { ObservableInput } from 'rxjs';

import { AccessTokenResponse } from './standard.types';
import { StateData } from './storages.types';
import { RequiredOnly } from './utils.type';

export type StateActionInfo<N extends string = string, T = unknown> = {
  name: N;
  data: T;
};

export type StateAction<S extends StateActionInfo = StateActionInfo> =
  StateData & {
    action?: S;
  };

export type StateActionProvided<S extends StateAction> = RequiredOnly<
  S,
  'action'
>;

/**
 * The function will be processed when the Oauth server responds with the access
 * token. It can return arbitrary information (T) to the caller.
 */
export type StateActionHandler<S extends StateAction, R> = (
  accessTokenResponse: AccessTokenResponse,
  stateAction: StateActionProvided<S>,
) => ObservableInput<R>;

/**
 * The function will be processed when the authorization server responds with an
 * error, or some errors occur in the authorization code exchange process. The
 * error always be rethrown internally.
 */
export type StateActionErrorHandler = (
  err: unknown,
  stateAction: StateAction | null,
) => void;

export type StateActionHandlers = {
  [action: string]: StateActionHandler<StateAction, unknown>;
};
