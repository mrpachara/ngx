import { TestBed } from '@angular/core/testing';

import { IdTokenConnection } from './id-token.connection';

describe('IdTokenConnection', () => {
  let service: IdTokenConnection;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdTokenConnection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
