import { TestBed } from '@angular/core/testing';

import { IdTokenIndexedDbStorage } from './id-token-indexed-db.storage';

describe('IdTokenIndexedDbStorage', () => {
  let service: IdTokenIndexedDbStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdTokenIndexedDbStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
