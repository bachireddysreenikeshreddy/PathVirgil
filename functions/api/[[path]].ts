// Route /api/* through the same secured API used by the Worker build.
// Pages provides D1, R2, and secrets through context.env on every request.
import { createHarborHandlers } from '../../lib/api-handlers';
import type { HarborAPIEnv } from '../../lib/api-handlers';

export const onRequest: PagesFunction<HarborAPIEnv> = ({request,env}) => {
  const api = createHarborHandlers(env);
  switch (request.method) {
    case 'GET': return api.GET(request);
    case 'POST': return api.POST(request);
    case 'OPTIONS': return api.OPTIONS(request);
    default: return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers:{'Content-Type':'application/json','Allow':'GET,POST,OPTIONS'}});
  }
};
