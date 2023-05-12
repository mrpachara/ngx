import { TestBed } from '@angular/core/testing';

import { AuthorizationCodeStorageFactory } from './authorization-code.storage.factory';

xdescribe('AuthorizationCodeStorageFactory', () => {
  let service: AuthorizationCodeStorageFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthorizationCodeStorageFactory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
