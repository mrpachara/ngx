import { TestBed } from '@angular/core/testing';

import { AccessTokenIndexedDbStorage } from './access-token-indexed-db.storage';

describe('AccessTokenIndexedDbStorage', () => {
  let service: AccessTokenIndexedDbStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessTokenIndexedDbStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
