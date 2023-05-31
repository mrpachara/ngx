import { TestBed } from '@angular/core/testing';

import { IdTokenStorageFactory } from './id-token.storage.factory';

describe('IdTokenStorageFactory', () => {
  let service: IdTokenStorageFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdTokenStorageFactory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
