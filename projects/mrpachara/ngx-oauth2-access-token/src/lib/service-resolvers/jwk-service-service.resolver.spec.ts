import { TestBed } from '@angular/core/testing';

import { JwkServiceResolver } from './jwk-service-service.resolver';

describe('JwkServiceResolver', () => {
  let service: JwkServiceResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JwkServiceResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
