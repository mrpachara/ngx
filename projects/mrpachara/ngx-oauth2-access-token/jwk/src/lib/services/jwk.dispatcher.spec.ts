import { TestBed } from '@angular/core/testing';

import { JwkDispatcher } from './jwk.dispatcher';

describe('JwkDispatcher', () => {
  let service: JwkDispatcher;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JwkDispatcher);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
