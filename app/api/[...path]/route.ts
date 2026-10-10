// Existing Workers build adapter: preserved for backwards compatibility.
import { env } from 'cloudflare:workers';
import { createHarborHandlers } from '../../../lib/api-handlers';
export const dynamic = 'force-dynamic';
export const {GET,POST,OPTIONS} = createHarborHandlers(env);
