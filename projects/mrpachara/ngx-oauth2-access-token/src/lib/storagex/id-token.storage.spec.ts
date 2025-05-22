import { TestBed } from '@angular/core/testing';

import { IdTokenStorage } from './id-token.storage';

describe('IdTokenStorage', () => {
  let service: IdTokenStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdTokenStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
