import { TestBed } from '@angular/core/testing';

import { AccessTokenIndexedDbConnection } from './access-token-indexed-db.connection';

describe('AccessTokenIndexedDbConnection', () => {
  let service: AccessTokenIndexedDbConnection;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessTokenIndexedDbConnection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
