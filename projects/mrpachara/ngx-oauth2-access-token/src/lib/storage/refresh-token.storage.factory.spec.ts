import { TestBed } from '@angular/core/testing';

import { RefreshTokenStorageFactory } from './refresh-token.storage.factory';

describe('RefreshTokenStorageService', () => {
  let service: RefreshTokenStorageFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RefreshTokenStorageFactory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
