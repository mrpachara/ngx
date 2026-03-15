import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorizationCodeCallback } from './autorization-code-callback';

describe('AuthorizationCodeCallbackComponent', () => {
  let component: AuthorizationCodeCallback<unknown>;
  let fixture: ComponentFixture<AuthorizationCodeCallback<unknown>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AuthorizationCodeCallback],
    });
    fixture = TestBed.createComponent(AuthorizationCodeCallback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
