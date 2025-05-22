import { TestBed } from '@angular/core/testing';

import { RefreshTokenStorage } from './refresh-token.storage';

describe('RefreshTokenStorage', () => {
  let service: RefreshTokenStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RefreshTokenStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
