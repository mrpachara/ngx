import { TestBed } from '@angular/core/testing';

import { AuthorizationCodeServiceResolver } from './authorization-code-service.resolver';

describe('AuthorizationCodeServiceResolver', () => {
  let service: AuthorizationCodeServiceResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthorizationCodeServiceResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
