import { TestBed } from '@angular/core/testing';

import { JwtRsassaVerifier } from './jwt-rsassa.verifier';

describe('JwtRsassaVerifier', () => {
  let service: JwtRsassaVerifier;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JwtRsassaVerifier);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
