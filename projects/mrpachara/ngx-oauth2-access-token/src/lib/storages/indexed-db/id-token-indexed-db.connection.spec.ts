import { TestBed } from '@angular/core/testing';

import { IdTokenIndexedDbConnection } from './id-token-indexed-db.connection';

describe('IdTokenIndexedDbConnection', () => {
  let service: IdTokenIndexedDbConnection;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdTokenIndexedDbConnection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
