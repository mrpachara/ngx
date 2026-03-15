import { InjectionToken } from '@angular/core';
import { StorageVersionChangedReloader } from '../types';

export const STORAGE_NAME = new InjectionToken<string>('storage-name');

const reloaderKeyName = 'storage-verion-changed-reloading';

export const STORAGE_VERSION_CHANGED_RELOADER =
  new InjectionToken<StorageVersionChangedReloader>(
    'storage-version-changed-reloader',
    {
      providedIn: 'root',
      factory: () => async (info) => {
        sessionStorage.setItem(
          reloaderKeyName,
          JSON.stringify([
            ...JSON.parse(sessionStorage.getItem(reloaderKeyName) ?? '[]'),
            { ...info, timestamp: Date.now() },
          ]),
        );
        console.log(reloaderKeyName, info);

        location.reload();
      },
    },
  );
