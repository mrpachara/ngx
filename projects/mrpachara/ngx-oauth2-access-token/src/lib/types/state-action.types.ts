import { ObservableInput } from 'rxjs';

import { AccessTokenResponse } from './standard.types';
import { StateData } from './storages.types';

export type StateActionType = `${string}:${string}`;

export type StateActionParams = StateData & {
  action?: StateActionType;
};

export type StateActionData = {
  [prop: string]: string | number | boolean;
};

export type StateActionInfo = {
  action: string;
  data: StateActionData;
};

/**
 * The function will be processed when the Oauth server responds with the access
 * token. It can return arbitrary information (T) to the caller.
 */
export type StateActionHandler<T> = (
  accessTokenResponse: AccessTokenResponse,
  data: StateActionData,
  stateData: StateData,
) => ObservableInput<T>;

/**
 * The function will be processed when the authorization server responds with an
 * error, or some errors occur in the authorization code exchange process. The
 * error always be rethrown internally.
 */
export type StateActionErrorHandler = (
  err: unknown,
  stateData: StateActionParams | null,
) => void;

export type StateActionHandlers = {
  [action: string]: StateActionHandler<unknown>;
};
