import { TestBed } from '@angular/core/testing';

import { StateIndexedDbConnection } from './state-indexed-db.connection';

describe('StateIndexedDbConnection', () => {
  let service: StateIndexedDbConnection;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StateIndexedDbConnection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
