import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ACCESS_TOKEN_NOTIFICATION } from '../tokens';

@Injectable()
export class IdTokenService {
  private readonly notificaiton = inject(ACCESS_TOKEN_NOTIFICATION);

  constructor() {
    this.notificaiton.pipe(takeUntilDestroyed()).subscribe((data) => {
      console.debug(data);
    });
  }
}
