import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutorizationCodeCallbackComponent } from './autorization-code-callback.component';

describe('AutorizationCodeCallbackComponent', () => {
  let component: AutorizationCodeCallbackComponent;
  let fixture: ComponentFixture<AutorizationCodeCallbackComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AutorizationCodeCallbackComponent]
    });
    fixture = TestBed.createComponent(AutorizationCodeCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
