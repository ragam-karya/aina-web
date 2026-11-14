// aina landing page: Badi Cloud links, the hero demo (3 scripted steps), the math "explain while marking"
// scene, the scrolly feature list, the notch tabs, the feedback form, and the active section in the nav.
// Animations use GSAP + ScrollTrigger from the CDN; everything else works without them.
(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Badi Cloud links ----------
  // The download and the feedback form go to Badi Cloud through this site's /api proxy (worker.js); the
  // address is set once, on <body data-cloud>. Subscribing has its own pages here (/masuk, /langganan).
  const cloud = (document.body.dataset.cloud || '').replace(/\/$/, '');
  if (cloud) for (const a of $$('[data-cloud-path]')) a.href = cloud + a.dataset.cloudPath;

  // ---------- in-page links scroll smoothly ----------
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
  });

  // ---------- fitur: the sticky visual follows the item you're reading ----------
  const DETAILS = [
    { label: 'Mendengar', text: '“Format bersyarat ada di mana ya?”', color: '#ff8a3d', w: 70, h: 18 },
    { label: 'Menjawab', text: 'Ada di menu Format, aku tunjukkan ya.', color: '#5aa9ff', w: 70, h: 18 },
    { label: 'Minta izin', text: 'Aku mau kirim email ke budi@x.com di Gmail. Boleh?', color: '#ff8a3d', w: 76, h: 22 },
    { label: '', text: '', color: '#5aa9ff', w: 22, h: 5.6 },
  ];
  const detailEls = $$('[data-detail]');
  const pins = $$('[data-pin]');
  let detailNow = -1;
  function setDetail(i) {
    if (i === detailNow) return;
    detailNow = i;
    const d = DETAILS[i];
    detailEls.forEach((el, k) => el.classList.toggle('on', k === i));
    pins.forEach((el, k) => el.classList.toggle('on', k === i));
    const notch = $('[data-dv-notch]');
    notch.style.width = d.w + 'cqw';
    notch.style.height = d.h + 'cqw';
    $('[data-dv-textwrap]').style.opacity = d.label ? 1 : 0;
    if (d.label) {
      const label = $('[data-dv-label]');
      label.textContent = d.label;
      label.style.color = d.color;
      $('[data-dv-text]').textContent = d.text;
    }
    $('[data-dv-cur]').classList.toggle('on', i === 1);
    $('[data-dv-fmt]').classList.toggle('on', i === 1);
    $('[data-dv-esc]').classList.toggle('on', i === 3);
  }
  setDetail(0);
  detailEls.forEach((el, i) => el.addEventListener('mouseenter', () => setDetail(i)));

  // ---------- notch tabs ----------
  const NCARDS = [
    { title: 'Home', meta: 'Rabu, 4 Nov', big: '09.41', unit: '31° cerah berawan', c: '#eef2f8', rows: [['Standup tim', '10.00'], ['Dzuhur', '11.39'], ['Ciro bekerja', '17 m']], glow: 'rgba(43,138,255,.55)' },
    { title: 'Pomodoro', meta: 'Fokus · 2/4', big: '22:18', unit: 'tersisa', c: '#ff8a3d', rows: [['Hari ini', '3 sesi · 1 j 15 m'], ['Preset', '25/5']], glow: 'rgba(255,138,61,.55)' },
    { title: 'Jadwal salat', meta: 'Jakarta Selatan', big: '11.39', unit: 'Dzuhur · 1 j 58 m lagi', c: '#5aa9ff', rows: [['Ashar', '14.59'], ['Maghrib', '17.52'], ['Isya', '19.04']], glow: 'rgba(61,220,151,.5)' },
    { title: 'Musik', meta: 'dari pemutar musik', big: '1:24', unit: '/ 3:34', c: '#a78bfa', rows: [['Senja di Kota', 'Nadira'], ['Lirik', 'LRCLIB']], glow: 'rgba(167,139,250,.55)' },
  ];
  const ncard = $('[data-ncard]');
  const nField = (k) => $('[data-n="' + k + '"]', ncard);
  function setNotch(i) {
    const c = NCARDS[i];
    nField('title').textContent = c.title;
    nField('meta').textContent = c.meta;
    nField('big').textContent = c.big;
    nField('big').style.color = c.c;
    nField('unit').textContent = c.unit;
    const rows = nField('rows');
    rows.textContent = '';
    for (const [a, b] of c.rows) {
      const row = document.createElement('div');
      const sa = document.createElement('span');
      const sb = document.createElement('span');
      sa.textContent = a;
      sb.textContent = b;
      row.append(sa, sb);
      rows.append(row);
    }
    ncard.style.boxShadow = '0 20px 40px -18px ' + c.glow;
    $$('[data-ntab]').forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  }
  setNotch(0);
  $$('[data-ntab]').forEach((b, i) => b.addEventListener('click', () => setNotch(i)));

  // ---------- feedback ----------
  const form = $('#feedbackForm');
  const ratings = $$('[data-rating]', form);
  for (const r of ratings) r.addEventListener('click', () => ratings.forEach((o) => o.setAttribute('aria-checked', String(o === r))));
  for (const chip of $$('.chips button', form)) {
    chip.addEventListener('click', () => chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')));
  }
  const status = $('#fbStatus');
  const say = (text, err) => {
    status.textContent = text;
    status.classList.toggle('err', Boolean(err));
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.elements.email;
    const message = form.elements.message;
    for (const el of [email, message]) el.setAttribute('aria-invalid', String(!el.checkValidity()));
    if (!email.checkValidity()) return say('Isi email yang valid dulu, ya.', true), email.focus();
    if (!message.checkValidity()) return say('Tulis masukanmu dulu, ya.', true), message.focus();

    const button = $('[type="submit"]', form);
    button.disabled = true;
    say('');
    try {
      const res = await fetch(cloud + '/masukan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.value.trim(),
          rating: Number($('[data-rating][aria-checked="true"]', form)?.dataset.rating) || null,
          improve: $$('.chips [aria-pressed="true"]', form).map((c) => c.textContent),
          message: message.value.trim(),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      say('Terima kasih! Masukanmu sudah kami terima.');
    } catch (err) {
      say('Masukanmu belum terkirim. Coba lagi sebentar lagi, ya.', true);
    } finally {
      button.disabled = false;
    }
  });

  // ---------- the section you're reading ----------
  const links = new Map($$('.nav-links a').map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const seen = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.classList.remove('active'));
        links.get(e.target.id)?.classList.add('active');
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_a, id) => { const s = document.getElementById(id); if (s) seen.observe(s); });
  }

  // ---------- animations (GSAP) ----------
  let tries = 0;
  (function waitForGsap() {
    if (window.gsap && window.ScrollTrigger) return initMotion(window.gsap, window.ScrollTrigger);
    if (++tries < 100) return setTimeout(waitForGsap, 50);
    // GSAP never loaded: show the end state of the math scene so it isn't blank.
    for (const el of $$('[data-mw]')) el.style.clipPath = 'none';
    for (const p of $$('[data-mp]')) { p.style.strokeDashoffset = 0; p.setAttribute('opacity', '1'); }
    $$('[data-tab]').forEach((b, k) => b.setAttribute('aria-pressed', String(k === 0)));
  })();

  function initMotion(gsap, ST) {
    gsap.registerPlugin(ST);
    gsap.ticker.lagSmoothing(500, 33);
    const safe = (name, fn) => { try { fn(); } catch (e) { console.error('[aina] ' + name, e); } };

    // Words appear one by one (blur + rise) inside a timeline.
    function words(tl, el, text, dur, at) {
      tl.call(() => {
        el.textContent = '';
        text.split(' ').forEach((w, i) => {
          const s = document.createElement('span');
          s.textContent = (i ? ' ' : '') + w;
          Object.assign(s.style, { opacity: '0', display: 'inline-block', whiteSpace: 'pre', transform: 'translateY(30%)', filter: 'blur(3px)' });
          el.appendChild(s);
        });
        const spans = Array.from(el.children);
        gsap.to(spans, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out', stagger: Math.max(0.04, dur / Math.max(1, spans.length)) });
      }, null, at);
      tl.to({}, { duration: dur }, at);
    }
    // Position of an element inside a scene, in the scene's unscaled pixels, offset by (dx, dy) cqw.
    function pos(el, dx, dy, scene) {
      const r = el.getBoundingClientRect(), d = scene.getBoundingClientRect();
      const u = scene.clientWidth / 100, k = scene.clientWidth / d.width;
      return { x: (r.left - d.left) * k + dx * u, y: (r.top - d.top) * k + dy * u };
    }

    safe('ticker', () => { const tk = $('[data-ticker]'); if (!reduce) gsap.to(tk, { x: () => -tk.scrollWidth / 2, duration: 38, ease: 'none', repeat: -1 }); });
    safe('hero', () => { if (!reduce) gsap.fromTo($$('[data-in]'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.07, delay: 0.05 }); });
    safe('reveal', () => { if (!reduce) $$('[data-rv]').forEach((el) => gsap.fromTo(el, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 86%', once: true } })); });
    safe('detail', () => detailEls.forEach((el, i) => ST.create({ trigger: el, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => { if (self.isActive) setDetail(i); } })));
    safe('zeros', () => { if (!reduce) $$('[data-zero]').forEach((el) => { const o = { v: 3 }; gsap.to(o, { v: 0, duration: 1.2, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); }, scrollTrigger: { trigger: el, start: 'top 85%', once: true } }); }); });
    safe('demo', () => heroDemo(gsap, ST, words, pos));
    safe('math', () => mathScene(gsap, ST, words, pos));

    // If the intro tween was interrupted (e.g. a background tab), make sure the hero is visible.
    setTimeout(() => {
      $$('[data-in]').forEach((el) => { if (parseFloat(getComputedStyle(el).opacity) < 0.05) gsap.set(el, { clearProps: 'opacity,transform' }); });
      ST.refresh();
    }, 2500);
    window.addEventListener('load', () => ST.refresh());
  }

  // ---------- hero demo: 1 ask, 2 shown, 3 done for you ----------
  function heroDemo(gsap, ST, words, pos) {
    const demo = $('[data-demo]');
    const q = (s) => $(s, demo);
    const notch = q('[data-notch]'), turn = q('[data-turn]'), quote = q('[data-quote]'), answer = q('[data-answer]');
    const acur = q('[data-acur]'), tip = q('[data-tip]'), ucur = q('[data-ucur]'), knob = q('[data-knob]');
    const tabs = $$('[data-tab]'), fills = $$('[data-tabfill]'), keys = $$('[data-key]', demo);
    const caption = $('[data-caption]');
    const CAPTIONS = ['Tanya layar · tahan Ctrl + Win', 'Panduan · kursor biru menunjuk', 'Kerjakan untukku · selalu minta izin'];
    const at = (el, dx, dy) => pos(el, dx, dy, demo);
    let tl, nextT, step = 0, visible = true;

    const setPhase = (t, c) => { const p = q('[data-phase]'); p.textContent = t; p.style.color = c; };

    function reset() {
      const W = demo.clientWidth, H = demo.clientHeight;
      gsap.killTweensOf($$('*', demo));
      gsap.set(['[data-turn]', '[data-ask]', '[data-up]', '[data-done]', '[data-acur]', '[data-tip]', '[data-keys]', '[data-scan]', '[data-ind]', '[data-think]'].map(q), { opacity: 0, scale: 1 });
      gsap.set(q('[data-wave]'), { opacity: 1 });
      gsap.set(q('[data-ind-mic]'), { opacity: 1 });
      gsap.set(q('[data-warm]'), { opacity: 0 });
      gsap.set(knob, { left: '45%', x: 0 });
      // non-scaling-stroke makes pathLength inexact in Chrome, so an undrawn stroke is also hidden with opacity.
      gsap.set(q('[data-marker] path'), { strokeDashoffset: 1, opacity: 0 });
      gsap.set(q('[data-up-bar]'), { width: '100%', scaleX: 0, transformOrigin: '0 50%' });
      gsap.set(q('[data-scan]'), { y: 0 });
      gsap.set(notch, { width: '13.2cqw', height: '2.8cqw', marginLeft: 0, xPercent: -50, borderRadius: '0 0 1.4cqw 1.4cqw' });
      gsap.set(acur, { left: 0, top: 0, x: W * 0.5, y: W * 0.09, rotation: -30, force3D: true });
      gsap.set(tip, { left: 0, top: 0, x: 0, y: 0, force3D: true });
      gsap.set(ucur, { left: 0, top: 0, x: W * 0.62, y: H * 0.84, force3D: true });
      gsap.set(keys, { y: 0, borderBottomWidth: '.35cqw' });
      quote.textContent = '';
      answer.textContent = '';
      q('[data-tempval]').textContent = '5600 K';
      setPhase('Mendengar', '#ff8a3d');
    }

    function play(i) {
      if (tl) tl.kill();
      clearTimeout(nextT);
      step = i;
      tabs.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      caption.textContent = CAPTIONS[i];
      reset();
      const W = demo.clientWidth, H = demo.clientHeight;
      gsap.set(fills, { scaleX: (k) => (k < i ? 1 : 0) });
      tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onUpdate: () => gsap.set(fills[i], { scaleX: tl.progress() }),
        onComplete: () => { nextT = setTimeout(() => play((i + 1) % 3), 700); },
      });
      const morph = (t, w, h, r, dur = 0.8) => tl.to(notch, { width: w + 'cqw', height: h + 'cqw', borderRadius: '0 0 ' + r + 'cqw ' + r + 'cqw', duration: dur, ease: 'expo.out' }, t);
      const openTurn = (t) => { morph(t, 52, 7.4, 2.6); tl.fromTo(turn, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.5 }, t + 0.25).to(q('[data-ind]'), { opacity: 1, duration: 0.3 }, t + 0.3); };
      const pressKeys = (t, up) => tl.fromTo(q('[data-keys]'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, t)
        .to(keys, { y: '.2cqw', borderBottomWidth: '.1cqw', duration: 0.15, stagger: 0.08, ease: 'power2.out' }, t + 0.25)
        .to(keys, { y: 0, borderBottomWidth: '.35cqw', duration: 0.15, ease: 'power2.out' }, up)
        .to(q('[data-keys]'), { opacity: 0, y: 10, duration: 0.4, ease: 'power2.in' }, up + 0.1);
      const glide = (el, p, t, dur = 1.1, ease = 'expo.inOut') => tl.to(el, { x: () => p().x, y: () => p().y, duration: dur, ease }, t);

      if (i === 0) {
        pressKeys(0.3, 2.7); openTurn(0.5);
        words(tl, quote, '“Gimana bikin warna videonya lebih hangat?”', 1.4, 0.95);
        tl.call(() => setPhase('Melihat area', '#5aa9ff'), null, 2.8).to(q('[data-wave]'), { opacity: 0, duration: 0.3 }, 2.8).to(q('[data-ind-mic]'), { opacity: 0, duration: 0.3 }, 2.8)
          .fromTo(q('[data-scan]'), { y: 0, opacity: 0 }, { y: H * 0.78, opacity: 1, duration: 1.1, ease: 'sine.inOut' }, 2.85).to(q('[data-scan]'), { opacity: 0, duration: 0.3, ease: 'sine.out' }, 3.75)
          .call(() => setPhase('Berpikir…', '#5aa9ff'), null, 3.9).to(q('[data-think]'), { opacity: 1, duration: 0.3 }, 3.9).to(q('[data-ind]'), { opacity: 0, duration: 0.3 }, 3.9)
          .call(() => setPhase('Menjawab', '#5aa9ff'), null, 4.7).to(q('[data-think]'), { opacity: 0, duration: 0.25 }, 4.7);
        morph(4.7, 52, 11.6, 2.6, 0.9);
        words(tl, answer, 'Buka panel Warna, lalu geser Temperature ke kanan.', 1.3, 4.95);
        tl.to({}, { duration: 1.2 });
      }
      if (i === 1) {
        tl.set(notch, { width: '52cqw', height: '11.6cqw', borderRadius: '0 0 2.6cqw 2.6cqw' }, 0).set(turn, { opacity: 1 }, 0).set(q('[data-wave]'), { opacity: 0 }, 0)
          .call(() => { setPhase('Menjawab', '#5aa9ff'); quote.textContent = '“Gimana bikin warna videonya lebih hangat?”'; }, null, 0);
        words(tl, answer, 'Geser Temperature ke kanan. Aku tunjukkan ya.', 0.9, 0.05);
        tl.fromTo(acur, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, 0.4);
        glide(acur, () => at(knob, 1.2, 1.4), 0.4, 1.3);
        tl.set(q('[data-marker] path'), { opacity: 1 }, 1.5).to(q('[data-marker] path'), { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, 1.5)
          .set(tip, { x: () => at(knob, 3.6, 3.4).x, y: () => at(knob, 3.6, 3.4).y }, 1.8)
          .fromTo(tip, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.8)' }, 1.8);
        glide(ucur, () => at(knob, 0.2, 0.3), 2.1, 1.2, 'power3.inOut');
        tl.to([acur, tip], { opacity: 0, duration: 0.4, ease: 'power2.out' }, 3.2);
        const dist = () => knob.parentNode.clientWidth * 0.37;
        tl.to(knob, { x: dist, duration: 1.4, ease: 'power2.inOut' }, 3.4)
          .to(ucur, { x: () => at(knob, 0.2, 0.3).x + dist(), duration: 1.4, ease: 'power2.inOut' }, 3.4)
          .to(q('[data-warm]'), { opacity: 1, duration: 1.4, ease: 'sine.inOut' }, 3.4)
          .to({ v: 5600 }, { v: 7400, duration: 1.4, ease: 'power2.inOut', onUpdate() { q('[data-tempval]').textContent = Math.round(this.targets()[0].v / 10) * 10 + ' K'; } }, 3.4)
          .to(q('[data-marker] path'), { opacity: 0, duration: 0.5 }, 4.9);
        words(tl, answer, 'Mantap, sudah lebih hangat.', 0.6, 5.0);
        tl.to({}, { duration: 1.2 });
      }
      if (i === 2) {
        tl.set(q('[data-warm]'), { opacity: 1 }, 0).set(knob, { x: () => knob.parentNode.clientWidth * 0.37 }, 0);
        pressKeys(0.2, 2.2); openTurn(0.4);
        words(tl, quote, '“Ekspor jadi MP4 terus upload ke Drive ya.”', 1.3, 0.85);
        tl.to(turn, { opacity: 0, duration: 0.3 }, 2.5).to(q('[data-ind]'), { opacity: 0, duration: 0.3 }, 2.5);
        morph(2.55, 50, 12.4, 2.6, 0.9);
        tl.fromTo(q('[data-ask]'), { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.5 }, 2.9);
        glide(ucur, () => at(q('[data-yes]'), 1.6, 1.4), 3.3, 1.2, 'power3.inOut');
        tl.to(q('[data-yes]'), { scale: 0.9, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut' }, 4.55)
          .to(q('[data-ask]'), { opacity: 0, duration: 0.3 }, 4.8);
        morph(4.85, 30, 4.6, 2.3, 0.8);
        glide(ucur, () => ({ x: W * 0.62, y: H * 0.84 }), 4.9, 1.1, 'power3.inOut');
        tl.to(q('[data-up]'), { opacity: 1, duration: 0.35 }, 5.2)
          .to(q('[data-up-bar]'), { scaleX: 1, duration: 1.8, ease: 'power1.inOut', onUpdate() { q('[data-up-label]').textContent = 'Drive · ' + Math.round(this.progress() * 100) + '%'; } }, 5.3)
          .to(q('[data-up]'), { opacity: 0, duration: 0.3 }, 7.2)
          .to(q('[data-done]'), { opacity: 1, duration: 0.35 }, 7.3)
          .to({}, { duration: 1.4 })
          .to(q('[data-done]'), { opacity: 0, duration: 0.3 });
        morph('>-0.1', 13.2, 2.8, 1.4, 0.7);
      }
      if (reduce) { tl.progress(0.98).pause(); return; }
      if (!visible) tl.pause();
    }

    tabs.forEach((b, i) => b.addEventListener('click', () => play(i)));
    play(0);
    // Save CPU: pause the loop while the demo is off screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (tl && !reduce) visible ? tl.resume() : tl.pause();
      }).observe(demo);
    }
    // Positions are measured in pixels, so restart the current step when the layout changes size.
    let rz;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => play(step), 250); });
  }

  // ---------- belajar: the explanation arrives with its marker strokes ----------
  function mathScene(gsap, ST, words, pos) {
    const scene = $('[data-math]');
    const q = (s) => $(s, scene);
    const notch = q('[data-mnotch]'), turn = q('[data-mturn]'), phase = q('[data-mphase]'), text = q('[data-mtext]'), cur = q('[data-mcur]');
    const P = $$('[data-mp]', scene), Wr = $$('[data-mw]', scene);
    const [circ2x, arrow, circX2, box] = P;
    const [wDu, wU, w1, w2, w3] = Wr;
    const SW = () => scene.clientWidth;
    const at = (el, dx, dy) => pos(el, dx, dy, scene);
    gsap.set(notch, { marginLeft: 0, xPercent: -50 });
    gsap.set(cur, { left: 0, top: 0, rotation: -30, force3D: true });
    const fly = (tl, el, dx, dy, t, dur = 1) => tl.to(cur, { x: () => at(el, dx, dy).x, y: () => at(el, dx, dy).y, opacity: 1, duration: dur, ease: 'expo.inOut' }, t);
    const write = (tl, el, t, dur) => {
      tl.to(el, { clipPath: 'inset(-30% -12% -30% -4%)', duration: dur, ease: 'sine.inOut' }, t);
      tl.fromTo(cur, { x: () => at(el, 0, 2.4).x, y: () => at(el, 0, 2.4).y }, { x: () => at(el, 0, 2.4).x + el.offsetWidth * 0.92, duration: dur, ease: 'sine.inOut', immediateRender: false }, t);
    };
    const draw = (tl, p, t, dur) => tl.set(p, { opacity: 1 }, t).to(p, { strokeDashoffset: 0, duration: dur, ease: 'power2.inOut' }, t);
    const say = (tl, s, t, dur = 0.8) => words(tl, text, s, dur, t);

    const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.4, defaults: { ease: 'power3.out' } });
    tl.set(P, { strokeDashoffset: 1, opacity: 0 }).set(Wr, { clipPath: 'inset(-30% 100% -30% -4%)', opacity: 1 })
      .set(cur, { opacity: 0, x: () => SW() * 0.5, y: () => SW() * 0.05 })
      .set(turn, { opacity: 0 }).set(notch, { width: '13.2cqw', height: '2.8cqw', borderRadius: '0 0 1.4cqw 1.4cqw' })
      .call(() => { phase.textContent = 'Mendengar'; phase.style.color = '#ff8a3d'; text.textContent = ''; })
      .to(notch, { width: '50cqw', height: '8.4cqw', borderRadius: '0 0 2.6cqw 2.6cqw', duration: 0.9, ease: 'expo.out' }, 0.3)
      .fromTo(turn, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.5 }, 0.55);
    say(tl, '“Soal nomor 3 ini gimana caranya? Aku bingung.”', 1.2, 0.8);
    tl.call(() => { phase.textContent = 'Menjawab'; phase.style.color = '#5aa9ff'; }, null, 2.6);
    say(tl, 'Kuncinya substitusi. Lihat x kuadrat ini.', 2.6);
    tl.fromTo(cur, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5 }, 2.8);
    fly(tl, q('[data-x2]'), 2.2, 2.6, 2.8, 1.2); draw(tl, circX2, 3.8, 0.8); write(tl, wU, 4.6, 0.9);
    say(tl, 'Misalkan u sama dengan x kuadrat. Turunannya 2x dx, dan 2x-nya sudah ada di soal.', 5.9, 1.2);
    fly(tl, circ2x.parentNode.parentNode, 2, 2.6, 6.1, 1.1); draw(tl, circ2x, 7.1, 0.7); draw(tl, arrow, 7.7, 0.6); write(tl, wDu, 8.2, 1);
    say(tl, 'Jadi tinggal integral cos u, hasilnya sin u.', 9.8);
    fly(tl, w1, 0, 2.4, 10, 1); write(tl, w1, 11, 1); write(tl, w2, 12.2, 1);
    say(tl, 'Kembalikan u jadi x kuadrat. Selesai!', 13.4);
    write(tl, w3, 13.6, 1); draw(tl, box, 14.7, 0.9);
    tl.to(cur, { opacity: 0, duration: 0.5 }, 16)
      .to([...P, ...Wr], { opacity: 0, duration: 0.6, ease: 'sine.inOut' }, 17.6)
      .to(turn, { opacity: 0, duration: 0.4 }, 17.6)
      .to(notch, { width: '13.2cqw', height: '2.8cqw', borderRadius: '0 0 1.4cqw 1.4cqw', duration: 0.7, ease: 'expo.inOut' }, 17.8);

    $('[data-replay]').addEventListener('click', () => (reduce ? tl.progress(0.85).pause() : tl.restart()));
    if (reduce) { tl.progress(0.85).pause(); return; }
    ST.create({ trigger: scene, start: 'top 75%', end: 'bottom top', onEnter: () => tl.play(), onEnterBack: () => tl.play(), onLeave: () => tl.pause(), onLeaveBack: () => tl.pause() });
  }
})();
