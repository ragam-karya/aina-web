// aina-landing: the landing page and the account pages (/masuk, /langganan, /terima-kasih) are static
// assets; /api/* goes on to the badi-cloud Worker through a service binding. The browser only ever
// talks to this domain, so the session cookie lives here and the Worker's own address stays out of
// the page. Redirects from badi-cloud (to Google, between pages) pass through as they are.
//
// Everything that runs this Worker (run_worker_first in wrangler.jsonc) lives only on the bare domain,
// so www.aina.ai.id sends it there: the session and login cookies belong to one host, Google's sign-in
// comes back to aina.ai.id, and search engines see one address per page.
//
// Traction: each page view and each installer download is written to Workers Analytics Engine (dataset
// aina_events, binding EVENTS), counted here on the server so an ad blocker doesn't hide it. No cookie
// and no stored IP: a visitor is a hash of the day, a secret salt, the IP and the browser, so the same
// person counts once a day and can't be followed from one day to the next. Queries: docs/analytics.md.

const PAGES = new Set(['/', '/playground', '/masuk', '/langganan', '/terima-kasih']);
const DOWNLOADS = new Set(['/api/download', '/api/download/windows']);
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|pagespeed|curl|wget|python|go-http|httpclient|monitor/i;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    let res;
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const to = new URL(url);
      to.pathname = url.pathname.slice(4) || '/';
      res = await env.API.fetch(new Request(to, request), { redirect: 'manual' });
    } else {
      res = await env.ASSETS.fetch(request);
    }
    const event = request.method !== 'GET' ? null : DOWNLOADS.has(url.pathname) ? 'download' : PAGES.has(url.pathname) ? 'pageview' : null;
    if (event && env.EVENTS) ctx.waitUntil(track(env, request, url, event, res.status).catch(() => {}));
    return res;
  },
};

async function track(env, request, url, event, status) {
  const ua = request.headers.get('user-agent') || '';
  const ip = request.headers.get('cf-connecting-ip') || '';
  const day = new Date().toISOString().slice(0, 10);
  const visitor = await sha256hex(`${day}|${env.VISITOR_SALT || ''}|${ip}|${ua}`);

  // Where they came from: another site's address (our own pages don't count as a source), and the
  // campaign tags of the page. A download's tags are those of the page it was clicked on.
  let referrer = '';
  let tags = url.searchParams;
  try {
    const ref = new URL(request.headers.get('referer') || '');
    if (ref.hostname.replace(/^www\./, '') === url.hostname) {
      if (event === 'download') tags = ref.searchParams;
    } else {
      referrer = ref.hostname.replace(/^www\./, '');
    }
  } catch {}
  const tag = (k) => (tags.get(k) || '').slice(0, 64).toLowerCase();
  const source = tag('utm_source') || tag('ref');

  env.EVENTS.writeDataPoint({
    indexes: [visitor.slice(0, 16)],
    blobs: [
      event,
      url.pathname,
      referrer,
      source,
      tag('utm_medium'),
      tag('utm_campaign'),
      request.cf?.country || request.headers.get('cf-ipcountry') || '',
      /tablet|ipad/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop',
      BOT.test(ua) || !ua ? '1' : '0',
      visitor.slice(0, 16),
      /windows/i.test(ua) ? 'windows' : /mac os/i.test(ua) ? 'mac' : /android/i.test(ua) ? 'android' : /iphone|ipad/i.test(ua) ? 'ios' : /linux/i.test(ua) ? 'linux' : 'other',
    ],
    doubles: [1, status],
  });
}

async function sha256hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
