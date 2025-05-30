import { TestBed } from '@angular/core/testing';

import { StateIndexedDbStorage } from './state-indexed-db.storage';

describe('StateIndexedDbStorage', () => {
  let service: StateIndexedDbStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StateIndexedDbStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
