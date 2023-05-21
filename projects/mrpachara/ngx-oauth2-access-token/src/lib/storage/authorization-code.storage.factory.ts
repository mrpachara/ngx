import { inject, Injectable } from '@angular/core';

import { StateExpiredError, StateNotFoundError } from '../errors';
import { KeyValuePairStorage, StateData } from '../types';
import { KEY_VALUE_PAIR_STORAGE } from '../tokens';

const stateDataKeyName = `oauth-code-state`;

const stateClearTtl = 10 * 60 * 1000;

export type StateDataContainer = {
  expires_at: number;
  data: StateData;
};

export class AuthorizationCodeStorage implements AuthorizationCodeStorage {
  private readonly stateKey = (stateId: string): string =>
    `${this.name}-${stateDataKeyName}-${stateId}`;

  private readonly loadStateDataContainer = async (
    stateKey: string,
  ): Promise<StateDataContainer | null> => {
    const stateDataContainer = await this.storage.loadItem<StateDataContainer>(
      stateKey,
    );

    if (stateDataContainer === null) {
      return null;
    }

    Object.freeze(stateDataContainer.data);

    return stateDataContainer;
  };

  private readonly ready: Promise<void>;

  constructor(
    private readonly name: string,
    private readonly stateTtl: number,
    private readonly storage: KeyValuePairStorage,
  ) {
    this.ready = this.clearStateDataContainers();
  }

  private async clearStateDataContainers(): Promise<void> {
    const currentTime = Date.now();
    const stateKeys = (await this.storage.keys()).filter((key) =>
      key.startsWith(this.stateKey('')),
    );

    for (const stateKey of stateKeys) {
      const storedStateDataContainer = await this.loadStateDataContainer(
        stateKey,
      );

      if (
        storedStateDataContainer &&
        storedStateDataContainer?.expires_at + stateClearTtl < currentTime
      ) {
        await this.storage.removeItem(stateKey);
      }
    }
  }

  async loadStateData(stateId: string): Promise<StateData> {
    await this.ready;

    const currentTime = Date.now();

    const storedStateDataContainer = await this.loadStateDataContainer(
      this.stateKey(stateId),
    );

    if (storedStateDataContainer === null) {
      throw new StateNotFoundError();
    }

    if (storedStateDataContainer.expires_at < currentTime) {
      throw new StateExpiredError();
    }

    return storedStateDataContainer.data;
  }

  async storeStateData(
    stateId: string,
    stateData: StateData,
  ): Promise<StateData> {
    await this.ready;

    await this.storage.storeItem(this.stateKey(stateId), {
      expires_at: Date.now() + this.stateTtl,
      data: stateData,
    });

    return stateData;
  }

  async removeStateData(stateId: string): Promise<void> {
    await this.ready;

    await this.storage.removeItem(this.stateKey(stateId));
  }
}

@Injectable({ providedIn: 'root' })
export class AuthorizationCodeStorageFactory {
  private readonly storage = inject(KEY_VALUE_PAIR_STORAGE);
  private readonly existingNameSet = new Set<string>();

  create(name: string, stateTtl: number): AuthorizationCodeStorage {
    if (this.existingNameSet.has(name)) {
      throw new Error(
        `Duplicated name '${name}' in authorization-code.storage.`,
      );
    }

    this.existingNameSet.add(name);

    return new AuthorizationCodeStorage(name, stateTtl, this.storage);
  }
}
