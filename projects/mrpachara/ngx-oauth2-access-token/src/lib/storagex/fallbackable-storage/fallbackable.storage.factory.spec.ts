import { TestBed } from '@angular/core/testing';

import { FallbackableStorageFactory } from './fallbackable.storage.factory';

describe('FallbackableStorageFactory', () => {
  let service: FallbackableStorageFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FallbackableStorageFactory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
