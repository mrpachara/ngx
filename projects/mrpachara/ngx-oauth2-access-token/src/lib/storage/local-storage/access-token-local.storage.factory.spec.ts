import { TestBed } from '@angular/core/testing';

import { AccessTokenLocalStorageFactory } from './access-token-local.storage.factory';

xdescribe('AccessTokenLocalStorageFactory', () => {
  let service: AccessTokenLocalStorageFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessTokenLocalStorageFactory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
