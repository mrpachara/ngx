import { Injectable } from '@angular/core';
import { defer, Observable, of, throwError } from 'rxjs';

import { StateExpiredError, StateNotFoundError } from '../../errors';
import {
  AuthorizationCodeStorage,
  AuthorizationCodeStorageFactory,
  StateData,
} from '../../types';
import { LocalStorage } from './local.storage';

const stateDataKeyName = `oauth-code-state`;
const stateTTL = 10 * 60 * 1000;
const stateClearTTL = 10 * 60 * 1000;

export type StateDataContainer = {
  expires_at: number;
  data: StateData;
};

export class AuthorizationCodeLocalStorage implements AuthorizationCodeStorage {
  private readonly stateKey = (stateId: string): string =>
    `${this.name}-${stateDataKeyName}-${stateId}`;

  private readonly loadStateDataContainer = (
    stateKey: string,
  ): StateDataContainer | null => {
    const stateDataContainer =
      this.storage.loadItem<StateDataContainer>(stateKey);

    if (stateDataContainer === null) {
      return null;
    }

    Object.freeze(stateDataContainer.data);

    return stateDataContainer;
  };

  constructor(
    private readonly name: string,
    private readonly storage: LocalStorage,
  ) {
    this.clearStateDataContainers();
  }

  private clearStateDataContainers(): void {
    const currentTime = Date.now();

    this.storage
      .keys()
      .filter((key) => key.startsWith(this.stateKey('')))
      .map(
        (stateKey) =>
          [stateKey, this.loadStateDataContainer(stateKey)] as const,
      )
      .filter(
        ([, storedStateDataContainer]) =>
          // NOTE: Must use ?. (storedStateDataContainer?.expires_at) for
          //       preventing error when the another tab had removed this item
          //       in the middle of this chain.
          //       Item may has different format due to storing from other apps
          //       using the same key.
          //       E.g.:
          //             undefine + stateClearTTL < currentTime // always false
          //             null + stateClearTTL < currentTime     // equal to 0 + stateClearTTL < currentTime
          storedStateDataContainer &&
          storedStateDataContainer?.expires_at + stateClearTTL < currentTime,
      )
      .forEach(([stateKey]) => this.storage.removeItem(stateKey));
  }

  loadStateData(stateId: string): Observable<StateData> {
    return defer(() => {
      const currentTime = Date.now();

      const storedStateDataContainer = this.loadStateDataContainer(
        this.stateKey(stateId),
      );

      if (storedStateDataContainer === null) {
        return throwError(() => new StateNotFoundError());
      }

      if (storedStateDataContainer.expires_at < currentTime) {
        return throwError(() => new StateExpiredError());
      }

      return of(storedStateDataContainer.data);
    });
  }

  storeStateData(stateId: string, stateData: StateData): Observable<StateData> {
    return defer(() => {
      this.storage.storeItem(this.stateKey(stateId), {
        expires_at: Date.now() + stateTTL,
        data: stateData,
      });

      return of(stateData);
    });
  }

  removeStateData(stateId: string): Observable<true> {
    return defer(() => {
      this.storage.removeItem(this.stateKey(stateId));

      return of(true as const);
    });
  }
}

@Injectable()
export class AuthorizationCodeLocalStorageFactory
  implements AuthorizationCodeStorageFactory
{
  constructor(private readonly storage: LocalStorage) {}

  create(name: string): AuthorizationCodeStorage {
    return new AuthorizationCodeLocalStorage(name, this.storage);
  }
}
