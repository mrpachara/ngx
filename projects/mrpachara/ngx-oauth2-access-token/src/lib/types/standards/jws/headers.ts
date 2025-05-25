import { RequiredOnly } from '../../utils';
import { JoseHeader } from '../jose/headers';

export type JwsHeader = RequiredOnly<JoseHeader, 'alg'>;
