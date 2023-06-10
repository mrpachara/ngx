import { TestBed } from '@angular/core/testing';

import { JwtEddsaVerifier } from './jwt-eddsa.verifier';

describe('JwtEddsaVerifier', () => {
  let service: JwtEddsaVerifier;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JwtEddsaVerifier);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
