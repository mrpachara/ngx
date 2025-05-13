import { TestBed } from '@angular/core/testing';

import { IndexedDbAccessTokenStorage } from './indexed-db-access-token.storage';

describe('IndexedDbAccessTokenStorage', () => {
  let service: IndexedDbAccessTokenStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IndexedDbAccessTokenStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
