import { TestBed } from '@angular/core/testing';

import { StateActionService } from './state-action.service';

xdescribe('OauthStateActionService', () => {
  let service: StateActionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StateActionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
