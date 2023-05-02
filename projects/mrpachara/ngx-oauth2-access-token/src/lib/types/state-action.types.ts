import { AccessToken } from './standard.types';

export type StateActionType = `${string}:${string}`;

export type StateAction = {
  action?: StateActionType;
};

export type StateActionHandler<T> = (
  value: string,
  accessToken: AccessToken,
) => T;

export type StateActionHandlers = {
  [action: string]: StateActionHandler<unknown>;
};
