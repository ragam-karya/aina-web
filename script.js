// B.A.D.I. landing page: Badi Cloud links, the use-case switch (demo window + feature panel), the plan
// switch, the feedback form, and the active section in the nav.
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Badi Cloud links ----------
  // Subscribing and the download live on Badi Cloud; its address is set once, on <body data-cloud>.
  const cloud = (document.body.dataset.cloud || '').replace(/\/$/, '');
  if (cloud) for (const a of document.querySelectorAll('[data-cloud-path]')) a.href = cloud + a.dataset.cloudPath;

  // A row of toggle buttons where exactly one is pressed.
  function single(buttons, onPick) {
    for (const b of buttons) {
      b.addEventListener('click', () => {
        if (b.getAttribute('aria-pressed') === 'true') return;
        for (const o of buttons) o.setAttribute('aria-pressed', String(o === b));
        onPick(b);
      });
    }
  }

  // ---------- use cases: each pill sets the demo window and the panel under it ----------
  const CASES = {
    1: { window: 'Video-Peluncuran — DaVinci Resolve', pointer: 'Efek Warna di sini', status: 'Menjawab', question: 'Gimana caranya bikin warna videonya lebih hangat?', answer: 'Buka tab Warna, lalu geser Temperature ke kanan. Aku tunjukkan ya.' },
    2: { window: 'Latihan-Soal.pdf', pointer: 'Soal yang kamu lingkari', status: 'Menjawab', question: 'Soal nomor tiga ini maksudnya gimana?', answer: 'Kita urai pelan-pelan. Pertama, tulis dulu apa yang diketahui dari soalnya.' },
    3: { window: 'Laporan-Bulanan.xlsx', pointer: 'Klik Insert di sini', status: 'Memandu', question: 'Gimana cara bikin pivot table dari data ini?', answer: 'Pilih datanya, buka Insert, lalu klik PivotTable. Aku pandu klik demi klik.' },
    4: { window: 'Gmail', pointer: 'Email penting hari ini', status: 'Menjawab', question: 'Cek email penting hari ini', answer: 'Ada beberapa email yang perlu kamu baca. Aku bacakan yang paling mendesak dulu, ya.' },
    5: { window: 'Notion', pointer: 'Halaman baru', status: 'Minta izin', question: 'Catat ide ini di Notion', answer: 'Boleh aku buat halaman baru di Notion dengan ide ini?' },
  };
  const demo = document.getElementById('demo');
  const fields = ['window', 'pointer', 'status', 'question', 'answer'].map((k) => [k, document.getElementById('demo' + k[0].toUpperCase() + k.slice(1))]);
  const panels = document.querySelectorAll('[data-panel]');
  let swap;

  function showCase(id) {
    const c = CASES[id];
    for (const p of panels) p.hidden = p.dataset.panel !== id;
    const fill = () => {
      for (const [k, el] of fields) el.textContent = c[k];
      demo.setAttribute('aria-label', 'Contoh: aina di ' + c.window);
      demo.classList.remove('swap');
    };
    clearTimeout(swap);
    if (reduced) return fill();
    demo.classList.add('swap');
    swap = setTimeout(fill, 220);
  }
  single(document.querySelectorAll('[data-case]'), (b) => showCase(b.dataset.case));

  // ---------- plans: subscription or top-up ----------
  const NOTES = {
    sub: 'Langganan bulanan: kredit termurah, siklus 30 hari. Sisa kredit hangus di akhir siklus.',
    topup: 'Top-Up: kredit tambahan yang tidak pernah hangus.',
  };
  const planNote = document.getElementById('planNote');
  const planGroups = document.querySelectorAll('[data-plans]');
  single(document.querySelectorAll('[data-plan]'), (b) => {
    for (const g of planGroups) g.hidden = g.dataset.plans !== b.dataset.plan;
    planNote.textContent = NOTES[b.dataset.plan];
  });

  // ---------- feedback ----------
  const form = document.getElementById('feedbackForm');
  const ratings = form.querySelectorAll('[data-rating]');
  for (const r of ratings) {
    r.addEventListener('click', () => {
      for (const o of ratings) o.setAttribute('aria-checked', String(o === r));
    });
  }
  for (const chip of form.querySelectorAll('.chips button')) {
    chip.addEventListener('click', () => chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')));
  }

  const status = document.getElementById('fbStatus');
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

    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    say('');
    try {
      const res = await fetch(cloud + '/masukan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.value.trim(),
          rating: Number(form.querySelector('[data-rating][aria-checked="true"]')?.dataset.rating) || null,
          improve: [...form.querySelectorAll('.chips [aria-pressed="true"]')].map((c) => c.textContent),
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
  const links = new Map([...document.querySelectorAll('nav.links a')].map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const seen = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          links.forEach((a) => a.classList.remove('active'));
          links.get(e.target.id)?.classList.add('active');
        }
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    links.forEach((_a, id) => {
      const section = document.getElementById(id);
      if (section) seen.observe(section);
    });
  }
})();
