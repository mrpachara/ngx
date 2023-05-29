import { inject, Injectable } from '@angular/core';

import { StateExpiredError, StateNotFoundError } from '../errors';
import { KeyValuePairStorage, StateData } from '../types';
import { KEY_VALUE_PAIR_STORAGE } from '../tokens';

const stateDataKeyName = `oauth-code-state` as const;

const stateClearTtl = 10 * 60 * 1000;

export type StateDataContainer<T extends StateData> = {
  expiresAt: number;
  data: T;
};

export class AuthorizationCodeStorage {
  private readonly stateKey = (stateId: string) =>
    `${this.name}-${stateDataKeyName}-${stateId}` as const;

  private readonly ready: Promise<void>;

  constructor(
    private readonly name: string,
    private readonly stateTtl: number,
    private readonly storage: KeyValuePairStorage,
  ) {
    this.ready = this.clearStateDataContainers();
  }

  private readonly loadStateDataContainer = async <
    T extends StateData = StateData,
  >(
    stateKey: string,
  ) => {
    const stateDataContainer = await this.storage.loadItem<
      StateDataContainer<T>
    >(stateKey);

    return stateDataContainer;
  };

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
        storedStateDataContainer?.expiresAt + stateClearTtl < currentTime
      ) {
        await this.storage.removeItem(stateKey);
      }
    }
  }

  async loadStateData<T extends StateData = StateData>(
    stateId: string,
  ): Promise<T> {
    await this.ready;

    const currentTime = Date.now();

    const storedStateDataContainer = await this.loadStateDataContainer<T>(
      this.stateKey(stateId),
    );

    if (storedStateDataContainer === null) {
      throw new StateNotFoundError();
    }

    if (storedStateDataContainer.expiresAt < currentTime) {
      throw new StateExpiredError();
    }

    return storedStateDataContainer.data;
  }

  async storeStateData<T extends StateData = StateData>(
    stateId: string,
    stateData: T,
  ): Promise<T> {
    await this.ready;

    await this.storage.storeItem(this.stateKey(stateId), {
      expires_at: Date.now() + this.stateTtl,
      data: stateData,
    });

    return stateData;
  }

  async removeStateData<T extends StateData = StateData>(
    stateId: string,
  ): Promise<T | null> {
    await this.ready;

    try {
      const stateData = await this.loadStateData<T>(stateId);
      await this.storage.removeItem(this.stateKey(stateId));
      return stateData;
    } catch (err) {
      await this.storage.removeItem(this.stateKey(stateId));
      return null;
    }
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
