// aina account pages: helpers shared by /masuk, /langganan and /terima-kasih. Everything from the
// server goes into the page as text (textContent), never as HTML. The API is aina Cloud through this
// site's /api proxy, with the session cookie.
(function () {
  const API = '/api';

  /** A call to aina Cloud: { ok, status, data } (data null when the body is not JSON). */
  async function api(path, opts = {}) {
    const init = { method: opts.method || 'GET', credentials: 'same-origin', headers: { accept: 'application/json' } };
    if (opts.body !== undefined) {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    let res;
    try {
      res = await fetch(API + path, init);
    } catch (e) {
      return { ok: false, status: 0, data: null };
    }
    let data = null;
    try { data = await res.json(); } catch (e) { /* not JSON */ }
    return { ok: res.ok, status: res.status, data };
  }

  /** The message in an error answer, or a fallback. */
  function errorText(r, fallback) {
    const m = r && r.data && r.data.error && r.data.error.message;
    if (m) return m;
    if (r && r.status === 0) return 'Koneksi terputus. Coba lagi sebentar lagi.';
    return fallback;
  }

  /** An element: el('a', { class: 'x', href: '/' }, 'text', child). Strings become text nodes. */
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v === null || v === undefined) continue;
      if (k === 'on') for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn);
      else if (k === 'class') n.className = v;
      else n.setAttribute(k, v === true ? '' : String(v));
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined || kid === false) continue;
      n.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return n;
  }

  /** SVG markup we write ourselves (icons), never server text. */
  function svg(markup) {
    const t = document.createElement('template');
    t.innerHTML = markup.trim();
    return t.content.firstChild;
  }

  const icons = {
    check: (size = 11, width = 3.2) => svg(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>`),
    cross: () => svg('<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'),
    chevron: () => svg('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5f6b7a" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'),
    google: () => svg('<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>'),
  };

  /** "Rp49.000". */
  function rupiah(n) {
    const v = Math.round(Number(n) || 0);
    return (v < 0 ? '-' : '') + 'Rp' + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /** "Rp49rb" for whole thousands (the cards), "Rp49.500" otherwise. */
  function rupiahShort(n) {
    const v = Math.round(Number(n) || 0);
    return v >= 1000 && v % 1000 === 0 ? 'Rp' + (v / 1000).toLocaleString('id-ID') + 'rb' : rupiah(v);
  }

  /** "4 Des 2026" from milliseconds. */
  function date(ms) {
    try {
      return new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
    } catch (e) {
      return '';
    }
  }

  /** A page of this site to go back to (a path, never another site), or the fallback. */
  function safeNext(s, fallback = '/langganan') {
    const ok = typeof s === 'string' && s.startsWith('/') && !s.startsWith('//') && !s.includes('\\') && !s.includes('://') && s.length <= 200 && !/[\u0000-\u001f]/.test(s);
    return ok ? s : fallback;
  }

  function query(name) {
    return new URLSearchParams(location.search).get(name);
  }

  /** The name to greet with: the first word of the Google name, or what comes before the @. */
  function firstName(account) {
    const name = (account && account.name || '').trim();
    if (name) return name.split(/\s+/)[0];
    return ((account && account.email) || '').split('@')[0];
  }

  function initial(account) {
    const s = ((account && (account.name || account.email)) || '?').trim();
    return (Array.from(s)[0] || '?').toUpperCase();
  }

  function creditsLeft(account) {
    const left = account && account.credits ? account.credits.left : 0;
    return typeof left === 'number' ? left.toLocaleString('id-ID') : String(left);
  }

  async function logout() {
    await api('/v1/auth/logout', { method: 'POST' });
    location.assign('/masuk');
  }

  /** The header of the signed-in pages: logo, nav and the account menu. */
  function header(account, current) {
    const logo = el('a', { href: '/', style: 'display:flex', 'aria-label': 'aina beranda' }, el('img', { src: '/img/aina-logo.png', alt: 'aina', height: 24, style: 'height:24px;width:auto' }));
    const links = el('div', { class: 'nav-links' },
      el('a', { href: '/langganan', 'aria-current': current === 'langganan' ? 'page' : false }, 'Langganan'),
      el('a', { href: '/api/download' }, 'Unduh'),
    );
    const nav = el('nav', { class: 'nav', 'aria-label': 'Akun' }, logo, links);
    if (account) {
      const menu = el('div', { class: 'menu', hidden: true, role: 'menu' },
        el('div', { class: 'menu-who' },
          el('b', {}, account.name || account.email),
          el('span', {}, `${account.planName || 'Free'} · ${creditsLeft(account)} kredit`),
        ),
        el('a', { href: '/langganan', role: 'menuitem' }, 'Langganan & tagihan'),
        el('a', { href: 'badi://open', role: 'menuitem' }, 'Buka aplikasi aina'),
        el('button', { type: 'button', class: 'out', role: 'menuitem', on: { click: logout } }, 'Keluar'),
      );
      const btn = el('button', { type: 'button', class: 'me-btn', 'aria-haspopup': 'menu', 'aria-expanded': 'false' },
        el('span', { class: 'avatar', 'aria-hidden': 'true' }, initial(account)),
        el('span', { class: 'me-email' }, account.email),
        icons.chevron(),
      );
      const toggle = (open) => {
        menu.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
      };
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle(menu.hidden);
      });
      document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target)) toggle(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { toggle(false); btn.focus(); } });
      nav.append(el('div', { class: 'me' }, btn, menu));
    }
    return el('header', { class: 'top' }, nav);
  }

  window.aina = { api, errorText, el, icons, rupiah, rupiahShort, date, safeNext, query, firstName, creditsLeft, header, logout };
})();
