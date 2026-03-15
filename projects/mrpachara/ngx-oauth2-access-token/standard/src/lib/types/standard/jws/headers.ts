import { RequiredOnly } from '@mrpachara/ngx-oauth2-access-token/utility';
import { JoseHeader } from '../jose/headers';

export type JwsHeader = RequiredOnly<JoseHeader, 'alg'>;
