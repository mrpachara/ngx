import { TestBed } from '@angular/core/testing';

import { JwtHmacVerifier } from './jwt-hmac.verifier';

describe('JwtHmacVerifier', () => {
  let service: JwtHmacVerifier;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JwtHmacVerifier);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
