import { AccessToken } from './standard.types';

export type StateActionType = `${string}:${string}`;

export type StateAction = {
  action?: StateActionType;
};

export type StateActionHandler = (
  value: string,
  accessToken: AccessToken,
) => unknown;

export type StateActionHandlers = {
  [action: string]: StateActionHandler;
};
