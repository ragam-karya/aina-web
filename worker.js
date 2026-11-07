// aina-landing: the landing page and the account pages (/masuk, /langganan, /terima-kasih) are static
// assets; /api/* goes on to the badi-cloud Worker through a service binding. The browser only ever
// talks to this domain, so the session cookie lives here and the Worker's own address stays out of
// the page. Redirects from badi-cloud (to Google, between pages) pass through as they are.
//
// The account pages and /api run only on the bare domain: the session and login cookies belong to one
// host, and Google's sign-in comes back to aina.ai.id, so www.aina.ai.id sends them there.
const ACCOUNT = /^\/(api(\/.*)?|masuk|langganan|terima-kasih)$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.startsWith('www.') && ACCOUNT.test(url.pathname)) {
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
