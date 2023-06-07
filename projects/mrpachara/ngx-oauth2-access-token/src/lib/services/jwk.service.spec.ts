import { TestBed } from '@angular/core/testing';

import { JwkService } from './jwk.service';

describe('JwkService', () => {
  let service: JwkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JwkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
