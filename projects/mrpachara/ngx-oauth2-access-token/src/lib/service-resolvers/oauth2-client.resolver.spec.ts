import { TestBed } from '@angular/core/testing';

import { Oauth2ClientResolver } from './oauth2-client.resolver';

describe('Oauth2ClientResolver', () => {
  let service: Oauth2ClientResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Oauth2ClientResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
