import { ObservableInput } from 'rxjs';

import { AccessToken } from './standard.types';
import { StateData } from './storages.types';

export type StateActionData = {
  [prop: string]: string | number | boolean;
};

export type StateActionInfo = {
  action: string;
  data: StateActionData;
};

export type StateActionHandler<T> = (
  accessToken: AccessToken,
  data: StateActionData,
  stateData: StateData,
) => ObservableInput<T>;

export type StateActionErrorHandler = (
  err: unknown,
  stateData: StateData | null,
) => void;

export type StateActionHandlers = {
  [action: string]: StateActionHandler<unknown>;
};
