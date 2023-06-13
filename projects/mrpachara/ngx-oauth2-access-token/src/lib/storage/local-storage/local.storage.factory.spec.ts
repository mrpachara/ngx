import { TestBed } from '@angular/core/testing';

import { LocalStorageFactory } from './local.storage.factory';

xdescribe('LocalStorage', () => {
  let service: LocalStorageFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageFactory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
