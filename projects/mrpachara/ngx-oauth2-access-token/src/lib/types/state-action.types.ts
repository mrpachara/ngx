import { ObservableInput } from 'rxjs';

import { StateData } from './oauth2-services.types';
import { AccessTokenResponse } from './standard.types';
import { RequiredOnly } from './utils.type';

/** The state action information */
export type StateActionInfo<N extends string = string, T = unknown> = {
  /** The name of action */
  name: N;

  /** The data of action */
  data: T;
};

/** The state data extension for state action */
export type StateAction<S extends StateActionInfo = StateActionInfo> =
  StateData & {
    action?: S;
  };

/** The state data that provides state action */
export type StateActionProvided<S extends StateAction> = RequiredOnly<
  S,
  'action'
>;

/**
 * The function will be processed when the OAuth 2.0 server responds with the
 * access token. It can return arbitrary information (T) to the caller.
 */
export type StateActionHandler<
  S extends StateAction = StateAction,
  R = unknown,
> = (
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
) => ObservableInput<void>;

/** The action name and handler pairs */
export type StateActionHandlers = {
  [action: string]: StateActionHandler<StateAction, unknown>;
};
