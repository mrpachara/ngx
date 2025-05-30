import { TestBed } from '@angular/core/testing';

import { IdTokenExtractor } from './id-token.extractor';

describe('IdTokenExtractor', () => {
  let service: IdTokenExtractor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdTokenExtractor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
