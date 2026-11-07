// aina-landing: the landing page and the account pages (/masuk, /langganan, /terima-kasih) are static
// assets; /api/* goes on to the badi-cloud Worker through a service binding. The browser only ever
// talks to this domain, so the session cookie lives here and the Worker's own address stays out of
// the page. Redirects from badi-cloud (to Google, between pages) pass through as they are.
//
// Everything that runs this Worker (run_worker_first in wrangler.jsonc) lives only on the bare domain,
// so www.aina.ai.id sends it there: the session and login cookies belong to one host, Google's sign-in
// comes back to aina.ai.id, and search engines see one address per page.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      url.pathname = url.pathname.slice(4) || '/';
      return env.API.fetch(new Request(url, request), { redirect: 'manual' });
    }
    return env.ASSETS.fetch(request);
  },
};
