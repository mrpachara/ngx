import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorizationCodeCallbackComponent } from './autorization-code-callback.component';

describe('AuthorizationCodeCallbackComponent', () => {
  let component: AuthorizationCodeCallbackComponent;
  let fixture: ComponentFixture<AuthorizationCodeCallbackComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AuthorizationCodeCallbackComponent],
    });
    fixture = TestBed.createComponent(AuthorizationCodeCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
