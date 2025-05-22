import { TestBed } from '@angular/core/testing';

import { IndexedDbStorageFactory } from './indexed-db.storage.factory';

describe('IndexedDbStorageFactory', () => {
  let service: IndexedDbStorageFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IndexedDbStorageFactory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
