import { TestBed } from '@angular/core/testing';

import { AccessTokenServiceResolver } from './access-token-service.resolver';

describe('AccessTokenServiceResolver', () => {
  let service: AccessTokenServiceResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessTokenServiceResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
