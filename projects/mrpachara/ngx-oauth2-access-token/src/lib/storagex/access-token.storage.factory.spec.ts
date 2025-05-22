import { TestBed } from '@angular/core/testing';

import { AccessTokenStorageFactory } from './access-token.storage.factory';

xdescribe('AccessTokenStorageFactory', () => {
  let service: AccessTokenStorageFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessTokenStorageFactory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
