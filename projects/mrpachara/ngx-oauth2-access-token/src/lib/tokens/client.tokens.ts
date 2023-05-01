import { HttpContextToken } from '@angular/common/http';

export const SKIP_ASSIGNING_ACCESS_TOKEN = new HttpContextToken(() => false);
