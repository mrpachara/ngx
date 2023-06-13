import { inject, Injectable } from '@angular/core';

import { StateExpiredError, StateNotFoundError } from '../errors';
import { KeyValuePairStorage, StateData } from '../types';
import { KEY_VALUE_PAIR_STORAGE_FACTORY } from '../tokens';

const stateDataKeyName = `oauth-code-state` as const;

const stateClearTtl = 10 * 60 * 1000;

type StateDataContainer<T extends StateData> = {
  expiresAt: number;
  data: T;
};

export class AuthorizationCodeStorage {
  private readonly stateKey = (stateId: string) =>
    `${stateDataKeyName}-${stateId}` as const;

  constructor(
    private readonly stateTtl: number,
    private readonly storage: Promise<KeyValuePairStorage>,
  ) {}

  private readonly loadStateDataContainer = async <
    T extends StateData = StateData,
  >(
    stateKey: string,
  ) => {
    const storage = await this.storage;

    const stateDataContainer = await storage.loadItem<StateDataContainer<T>>(
      stateKey,
    );

    return stateDataContainer;
  };

  async loadStateData<T extends StateData = StateData>(
    stateId: string,
  ): Promise<T> {
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
    const storage = await this.storage;

    await storage.storeItem(this.stateKey(stateId), {
      expires_at: Date.now() + this.stateTtl,
      data: stateData,
    });

    return stateData;
  }

  async removeStateData<T extends StateData = StateData>(
    stateId: string,
  ): Promise<T | null> {
    const storage = await this.storage;

    try {
      const stateData = await this.loadStateData<T>(stateId);
      await storage.removeItem(this.stateKey(stateId));
      return stateData;
    } catch (err) {
      await storage.removeItem(this.stateKey(stateId));
      return null;
    }
  }
}

@Injectable({ providedIn: 'root' })
export class AuthorizationCodeStorageFactory {
  private readonly storageFactory = inject(KEY_VALUE_PAIR_STORAGE_FACTORY);
  private readonly existingNameSet = new Set<string>();

  private async createStorage(
    storageName: string,
  ): Promise<KeyValuePairStorage> {
    const storage = this.storageFactory.create(storageName);

    const currentTime = Date.now();

    const prefix = `${stateDataKeyName}-` as const;

    const stateKeys = (await storage.keys()).filter((key) =>
      key.startsWith(prefix),
    );

    for (const stateKey of stateKeys) {
      const storedStateDataContainer = await storage.loadItem<
        StateDataContainer<StateData>
      >(stateKey);

      if (
        storedStateDataContainer &&
        storedStateDataContainer?.expiresAt + stateClearTtl < currentTime
      ) {
        await storage.removeItem(stateKey);
      }
    }

    return storage;
  }

  create(name: string, stateTtl: number): AuthorizationCodeStorage {
    if (this.existingNameSet.has(name)) {
      throw new Error(
        `Duplicated name '${name}' in authorization-code.storage.`,
      );
    }

    this.existingNameSet.add(name);

    return new AuthorizationCodeStorage(stateTtl, this.createStorage(name));
  }
}
