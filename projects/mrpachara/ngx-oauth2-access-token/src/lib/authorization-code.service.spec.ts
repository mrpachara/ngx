import { TestBed } from '@angular/core/testing';

import { AuthorizationCodeService } from './authorization-code.service';

xdescribe('AuthorizationCodeService', () => {
  let service: AuthorizationCodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthorizationCodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
