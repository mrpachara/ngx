import { TestBed } from '@angular/core/testing';

import { JwtEcdsaVerifier } from './jwt-ecdsa.verifier';

describe('JwtEcdsaVerifier', () => {
  let service: JwtEcdsaVerifier;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JwtEcdsaVerifier);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
