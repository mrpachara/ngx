import { TestBed } from '@angular/core/testing';

import { AuthorizationCodeLocalStorageFactory } from './authorization-code-local.storage.factory';

xdescribe('AuthorizationCodeLocalStorageFactory', () => {
  let service: AuthorizationCodeLocalStorageFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthorizationCodeLocalStorageFactory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
