import { inject, Injectable } from '@angular/core';

import { StateExpiredError, StateNotFoundError } from '../errors';
import { KEY_VALUE_PAIR_STORAGE_FACTORY } from '../tokens';
import { DeepReadonly, KeyValuePairsStorage, StateData } from '../types';

const stateDataKeyName = `oauth-code-state` as const;

const stateClearTtl = 10 * 60 * 1000;

interface StateDataContainer<T extends StateData> {
  expiresAt: number;
  data: T;
}

/** Authorization code storage */
export class AuthorizationCodeStorage {
  private readonly stateKey = (stateId: string) =>
    `${stateDataKeyName}-${stateId}` as const;

  constructor(
    private readonly stateTtl: number,
    private readonly storage: Promise<KeyValuePairsStorage>,
  ) {}

  private readonly loadStateDataContainer = async <
    T extends StateData = StateData,
  >(
    stateKey: string,
  ) => {
    const storage = await this.storage;

    const stateDataContainer =
      await storage.loadItem<StateDataContainer<T>>(stateKey);

    return stateDataContainer;
  };

  /**
   * Load state data.
   *
   * @param stateId The state ID
   * @returns The `Promise` of immuable state data
   */
  async loadStateData<T extends StateData = StateData>(
    stateId: string,
  ): Promise<DeepReadonly<T>> {
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

  /**
   * Store state data.
   *
   * @param stateId The state ID
   * @param stateData The state data to be stored
   * @returns The `Promise` of immuable state data
   */
  async storeStateData<T extends StateData = StateData>(
    stateId: string,
    stateData: T,
  ): Promise<DeepReadonly<T>> {
    const storage = await this.storage;

    await storage.storeItem(this.stateKey(stateId), {
      expires_at: Date.now() + this.stateTtl,
      data: stateData,
    });

    return await this.loadStateData<T>(stateId);
  }

  /**
   * Remove state data.
   *
   * @param stateId The state ID
   * @returns The `Promise` of immuable state data or `null` when not found
   */
  async removeStateData<T extends StateData = StateData>(
    stateId: string,
  ): Promise<DeepReadonly<T | null>> {
    const storage = await this.storage;

    try {
      const stateData = await this.loadStateData<T>(stateId);
      await storage.removeItem(this.stateKey(stateId));
      return stateData;
    } catch {
      await storage.removeItem(this.stateKey(stateId));
      return null;
    }
  }
}

/** Authorization code storage factory creates storage for specific storage name */
@Injectable({ providedIn: 'root' })
export class AuthorizationCodeStorageFactory {
  private readonly storageFactory = inject(KEY_VALUE_PAIR_STORAGE_FACTORY);
  private readonly existingNameSet = new Set<string>();

  private async createStorage(
    storageName: string,
  ): Promise<KeyValuePairsStorage> {
    const storage = this.storageFactory.get(storageName);

    const currentTime = Date.now();

    const prefix = `${stateDataKeyName}-` as const;

    const stateKeys = (await storage.keys()).filter((key) =>
      key.startsWith(prefix),
    );

    for (const stateKey of stateKeys) {
      const storedStateDataContainer =
        await storage.loadItem<StateDataContainer<StateData>>(stateKey);

      if (
        storedStateDataContainer &&
        storedStateDataContainer?.expiresAt + stateClearTtl < currentTime
      ) {
        await storage.removeItem(stateKey);
      }
    }

    return storage;
  }

  /**
   * Create storage from `name`. The `name` **MUST** be unique.
   *
   * @param name The name of storage
   * @returns The storage
   */
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
