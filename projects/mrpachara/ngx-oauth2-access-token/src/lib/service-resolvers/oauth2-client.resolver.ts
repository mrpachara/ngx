import { Injectable, inject } from '@angular/core';
import { Oauth2Client } from '../services';
import { OATUTH2_CLIENTS } from '../tokens';

/** OAuth 2.0 client resolver */
@Injectable({
  providedIn: 'root',
})
export class Oauth2ClientResolver {
  private readonly oauth2Clients = inject(OATUTH2_CLIENTS);

  /**
   * Find an OAuth 2.0 client from the given `name`.
   *
   * @param name The name for finding
   * @returns The OAuth 2.0 client or `null` when not found
   */
  find(name: string): Oauth2Client | null {
    for (const oauth2Client of this.oauth2Clients) {
      if (oauth2Client.name === name) {
        return oauth2Client;
      }
    }

    return null;
  }
}
