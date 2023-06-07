import { Injectable, inject } from '@angular/core';
import { OATUTH2_CLIENTS } from '../tokens';
import { Oauth2Client } from '../services';

@Injectable({
  providedIn: 'root',
})
export class Oauth2ClientResolver {
  private readonly oauth2Clients = inject(OATUTH2_CLIENTS);

  find(name: string): Oauth2Client | null {
    for (const oauth2Client of this.oauth2Clients) {
      if (oauth2Client.name === name) {
        return oauth2Client;
      }
    }

    return null;
  }
}
