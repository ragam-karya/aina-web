// The playground's notch, drawn the way aina-notch draws it (its markup: tools/playground-notch.html;
// its styles and icons are read from aina-notch by tools/build-playground.py). Two parts: code for the
// top of playground.js, then members added to the Playground class (after the "class members" line).

// Features of the notch shown in the playground. The design has all of them; each one is turned on
// here once aina-notch has it. Until then its try-it buttons, pages and views stay in the code, hidden.
const FEATURES = {
  learn: false, // Belajar: explaining a worksheet while marking it
  whatsapp: false, // WhatsApp: connect, read and answer chats, and its notch page
  privacy: false, // the mic and screen dots, "don't look at this app", undo, quiet mode, the Privacy page
  clipboard: false, // what a copied number, phone number or tracking number offers (terbilang, WA, resi)
  parcel: false, // the "parcel on its way" pill
  ask: false, // Tanya layar: hold Ctrl + Alt (or the button) and ask about the screen
  library: false, // the Notes & knowledge page
  dictation: false, // Dikte: tap or hold Ctrl + Win to dictate a note (as aina-notch's dictation.rs)
};
// Trying a hidden feature: ?fitur=ask,dictation turns those on in this tab only.
for (const f of (new URLSearchParams(location.search).get('fitur') || '').split(',')) if (f in FEATURES) FEATURES[f] = true;
// Dictation's timings, as in aina-notch (dictation.rs): released sooner than TAP the press only
// switched dictation on; shorter than MIN in all it is dropped; it ends by itself after MAX.
const DK_TAP_MS = 600, DK_MIN_MS = 350, DK_MAX_S = 600;
// The notch's pages, by their index in Playground.pages, and the feature a page needs.
const PAGE_FEATURE = { 6: 'library', 8: 'privacy', 9: 'whatsapp' };
const pageOn = (i) => !PAGE_FEATURE[i] || FEATURES[PAGE_FEATURE[i]];
// Parts of the design's own page (not the notch) hidden while their feature is off: .no-ask in playground.css.
if (!FEATURES.ask) document.documentElement.classList.add('no-ask');
// What each page is in aina-notch (island.js): its id, its color (the glow) and its dot's icon.
const NPAGES = [
  { id: 'home', k: '#2b8aff', icon: ['home', 'home'] },
  { id: 'timer', k: '#ff8a3d', icon: ['IoTimerOutline', 'IoTimer'] },
  { id: 'later', k: '#2b8aff', icon: ['IoNotificationsOutline', 'IoNotifications'] },
  { id: 'prayer', k: '#3ddc97', icon: ['mosque', 'mosque'] },
  { id: 'media', k: '#a78bfa', icon: ['IoMusicalNotesOutline', 'IoMusicalNotes'] },
  { id: 'focus', k: '#3ddc97', icon: ['IoFolderOpenOutline', 'IoFolderOpen'] },
  { id: 'library', k: '#2b8aff', icon: ['book', 'book'] },
  { id: 'tasks', k: '#f5a524', icon: ['IoSparklesOutline', 'IoSparkles'] },
];
// The notch's own icons, from aina-notch at build time (icons.js and reacticons.js), as preact nodes.
const NICONS = __NICONS__;
const NREACT = __NREACT__;
const MOSQUE = 'M12 2.5c.4 1.2 1.6 2 1.6 3.4a1.6 1.6 0 0 1-3.2 0c0-1.4 1.2-2.2 1.6-3.4ZM5 21V12.5C5 9 8 7.6 12 7.6s7 1.4 7 4.9V21h-4.5v-3.8a2.5 2.5 0 0 0-5 0V21H5Zm-3 0v-7.5l1.5-1.5L5 13.5V21H2Zm17 0v-7.5l1.5-1.5 1.5 1.5V21h-3Z';
function nIcon(name, size = 16) {
  if (name === 'mosque') return h('span', { class: 'ico' }, h('svg', { viewBox: '0 0 24 24', width: size, height: size, fill: 'currentColor', 'aria-hidden': 'true' }, h('path', { d: MOSQUE })));
  if (/^Io[A-Z]/.test(name)) {
    const t = NREACT[name] || IO5[name];
    if (!t) return null;
    const svg = icoNode(t, true);
    Object.assign(svg.props, { width: size, height: size, 'aria-hidden': 'true', class: 'ico ri ri-' + name });
    return svg;
  }
  const parts = NICONS[name];
  if (!parts) return null;
  return h('svg', { viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true', class: 'ico ico-' + name },
    parts.map(([tag, a]) => {
      const p = {};
      for (const [k, v] of Object.entries(a)) if (k !== 'fill') p[k] = v;
      if (a.fill) p.fill = 'currentColor';
      else Object.assign(p, { fill: 'none', stroke: 'currentColor', 'stroke-width': '1.9', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      return h(tag, p);
    }));
}
// The timer's ring: `left` the share of the phase still to go (1 → 0), as in the notch.
function ringNode(size, width, left) {
  const r = (size - width) / 2;
  const len = 2 * Math.PI * r;
  const c = size / 2;
  return h('svg', { viewBox: `0 0 ${size} ${size}`, width: size, height: size, class: 'ring' },
    h('circle', { cx: c, cy: c, r, fill: 'none', 'stroke-width': width, class: 'ring-bg' }),
    h('circle', { cx: c, cy: c, r, fill: 'none', 'stroke-width': width, class: 'ring-fg', 'stroke-dasharray': len.toFixed(2), 'stroke-linecap': 'round', transform: `rotate(-90 ${c} ${c})`, 'stroke-dashoffset': (len * (1 - Math.max(0, Math.min(1, left)))).toFixed(2) }));
}
const withIcon = (name, text, size = 15) => [nIcon(name, size), ' ' + text];

// ---- class members ----

  // ---- The talk and dictation keys, as aina-notch reads them (aina-input hotkeys.rs, talk.rs) ----
  // Ctrl + Alt asks while held (FEATURES.ask); Ctrl + Win dictates (FEATURES.dictation). Asking is never
  // Ctrl + Win. A combo counts only when exactly its modifiers are down; a real key pressed during a
  // hold means a shortcut, not talking, and cancels it; Esc stops everything.
  comboOf(e) {
    if (e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey) return 'ask';
    if (e.ctrlKey && e.metaKey && !e.altKey && !e.shiftKey) return 'dikte';
    return '';
  }
  hotkeyDown(e) {
    if (e.key === 'Escape') return; // escape() has it
    if (!['Control', 'Alt', 'Meta', 'Shift', 'AltGraph'].includes(e.key)) {
      if (this.keysHeld === 'ask') { this.keysHeld = ''; this.escape(); }
      else if (this.keysHeld === 'dikte') { this.keysHeld = ''; this.dikteCancel(); }
      return;
    }
    if (e.repeat || this.keysHeld) return;
    const combo = this.comboOf(e);
    if (combo === 'ask' && FEATURES.ask) { e.preventDefault(); this.keysHeld = 'ask'; this.holdStart(); }
    if (combo === 'dikte' && FEATURES.dictation) { e.preventDefault(); this.keysHeld = 'dikte'; this.dikteDown(); }
  }
  hotkeyUp(e) {
    const held = this.keysHeld;
    if (!held || !(held === 'ask' ? ['Control', 'Alt'] : ['Control', 'Meta']).includes(e.key)) return;
    this.keysHeld = '';
    if (held === 'ask') this.holdEnd(); else this.dikteUp();
  }
  hotkeyBlur() {
    const held = this.keysHeld;
    this.keysHeld = '';
    if (held === 'dikte') this.dikteUp();
    else this.holdEnd();
  }
  // Asking. Pressed while a dictation runs, the talk keys only end (and save) it: that press is not a
  // question, and neither is its release.
  holdStart = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (this.dk) { this.askEndsDikte = true; this.dikteStop(); return; }
    if (this.state.holding) return;
    this.clear();
    this.setState({ mode: 'turn', phase: 0, typed: 0, holding: true, dlOpen: false });
    this.later(() => this.holdEnd(), 12000);
  };
  holdEnd = () => {
    if (this.askEndsDikte) { this.askEndsDikte = false; return; }
    if (!this.state.holding) return;
    this.clear();
    this.setState({ holding: false, mode: 'turn', phase: 1 });
    this.later(() => this.setState({ phase: 2 }), 1200);
    this.later(() => this.startAnswer(), 2600);
    this.later(() => this.toBase(), 13000);
  };
  // Esc drops a dictation too (it is not saved).
  escape = () => {
    this.keysHeld = '';
    this.askEndsDikte = false;
    this.dikteCancel(false);
    this.setState({ holding: false });
    this.toBase();
  };
  // Dictating (dictation.rs). The keys down: start, or end the one running. Not while asking.
  dikteDown() {
    if (this.state.holding) return;
    if (this.dk) { this.dkSkipUp = true; this.dikteStop(); return; }
    this.clear();
    this.dk = { at: Date.now() };
    this.setState({ mode: 'dikteRec', dkPhase: 'rec', dkSec: 0, dkHeld: true, typed: 0, dlOpen: false });
    clearInterval(this.dkIv);
    this.dkIv = setInterval(() => {
      if (!this.dk || this.state.mode !== 'dikteRec') return this.dikteCancel(false);
      const sec = Math.floor((Date.now() - this.dk.at) / 1000);
      if (sec >= DK_MAX_S) return this.dikteStop();
      if (sec !== this.state.dkSec) this.setState({ dkSec: sec });
    }, 250);
  }
  // The keys released: a hold ends there; a quick press leaves it running.
  dikteUp() {
    if (this.dkSkipUp) { this.dkSkipUp = false; return; }
    if (!this.dk) return;
    if (Date.now() - this.dk.at >= DK_TAP_MS) this.dikteStop();
    else this.setState({ dkHeld: false });
  }
  // Ends and saves it: written up, then the saved note.
  dikteStop() {
    if (!this.dk) return;
    const held = Date.now() - this.dk.at;
    this.dk = null;
    clearInterval(this.dkIv);
    if (held < DK_MIN_MS) return this.toBase();
    this.clear();
    this.setState({ mode: 'dikteRec', dkPhase: 'write', dkHeld: false });
    this.later(() => this.moment('dikte'), 1400);
  }
  dikteCancel(toBase = true) {
    this.dkSkipUp = false;
    if (!this.dk) return;
    this.dk = null;
    clearInterval(this.dkIv);
    if (toBase) this.toBase();
  }
  // The panel's button: a click is a tap.
  dikteClick() {
    if (this.dk) return this.dikteStop();
    this.dikteDown();
    if (this.dk) this.setState({ dkHeld: false });
  }

  // The pages shown (those whose feature is on), and paging within them, stopping at either end as
  // the notch does.
  pagesOn() { return this.pages.map((_, i) => i).filter(pageOn); }
  go(d) {
    const on = this.pagesOn();
    const at = Math.max(0, on.indexOf(this.state.page));
    this.setState({ page: on[Math.max(0, Math.min(on.length - 1, at + d))] });
  }
  // Allowing an action: undo is a Privacy feature; without it, a notice says what was done.
  answerWith(k) {
    this.clear();
    if (k === 'yes' && FEATURES.privacy) { this.setState({ mode: 'undo' }); this.later(() => this.toBase(), 7000); return; }
    const msg = { yes: 'kalkulator.html dipindah ke Recycle Bin', all: 'Oke, sisa tugas ini tidak ditanya lagi', no: 'Oke, nggak jadi.' }[k];
    this.setState({ mode: 'notice', notice: k === 'no' ? 'no' : 'ok', noticeMsg: msg });
    this.later(() => this.toBase(), 2600);
  }

  // ---- the quick box (Home), as aina-notch works it out (island.js: readQuery, terbilang) ----
  nNumber(t) {
    const SCALE = { rb: 1e3, ribu: 1e3, k: 1e3, jt: 1e6, juta: 1e6, m: 1e9, miliar: 1e9, t: 1e12, triliun: 1e12 };
    const m = String(t).trim().toLowerCase().match(/^([\d.,]+)\s*(rb|ribu|k|jt|juta|miliar|m|triliun|t)?$/);
    if (!m) return NaN;
    let v = m[1];
    if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, '');
    const n = parseFloat(v);
    return Number.isFinite(n) ? n * (SCALE[m[2]] || 1) : NaN;
  }
  nSum(src) {
    const tokens = [];
    const re = /\s*(?:([\d.,]+\s*(?:ribu|rb|juta|jt|miliar|triliun|k|m|t)?(?![a-z]))|([-+*/()]))/iy;
    const text = src.replace(/[x×]/gi, '*').replace(/[:÷]/g, '/');
    let i = 0;
    while (i < text.length) {
      re.lastIndex = i;
      const m = re.exec(text);
      if (!m) return null;
      if (m[1] !== undefined) {
        const n = this.nNumber(m[1]);
        if (Number.isNaN(n)) return null;
        tokens.push(n);
      } else tokens.push(m[2]);
      i = re.lastIndex;
      if (/^\s*$/.test(text.slice(i))) break;
    }
    let k = 0;
    const peek = () => tokens[k];
    const factor = () => {
      const t = tokens[k++];
      if (t === '-') return -factor();
      if (t === '+') return factor();
      if (t === '(') { const v = expr(); if (tokens[k++] !== ')') throw 0; return v; }
      if (typeof t === 'number') return t;
      throw 0;
    };
    const term = () => { let v = factor(); while (peek() === '*' || peek() === '/') v = tokens[k++] === '*' ? v * factor() : v / factor(); return v; };
    const expr = () => { let v = term(); while (peek() === '+' || peek() === '-') v = tokens[k++] === '+' ? v + term() : v - term(); return v; };
    try { const v = expr(); return k === tokens.length && Number.isFinite(v) ? v : null; } catch (e) { return null; }
  }
  nRupiah(n) { return 'Rp ' + Math.round(n).toLocaleString('id-ID'); }
  nRead(q) {
    const t = q.trim().toLowerCase();
    if (!t) return null;
    const N = '([\\d.,]+\\s*(?:ribu|rb|juta|jt|miliar|triliun|k|m|t)?)';
    let m;
    if ((m = t.match(new RegExp(`^${N}\\s*%\\s*(?:dari|of|x|×|\\*)\\s*${N}$`)))) {
      const [a, b] = [this.nNumber(m[1]), this.nNumber(m[2])];
      if (!Number.isNaN(a) && !Number.isNaN(b)) return { kind: 'sum', value: (a / 100) * b, sub: `${a}% × ${this.nRupiah(b)}` };
    }
    if ((m = t.match(new RegExp(`^(?:ppn|pajak|tax)\\s*${N}\\s*%\\s*(?:dari\\s*)?${N}$`)))) {
      const [a, b] = [this.nNumber(m[1]), this.nNumber(m[2])];
      if (!Number.isNaN(a) && !Number.isNaN(b)) return { kind: 'sum', value: (b * a) / 100, sub: `PPN ${a}% · total ${this.nRupiah(b + (b * a) / 100)}` };
    }
    const alone = this.nNumber(t);
    if (!Number.isNaN(alone)) return { kind: 'words', value: alone, sub: 'Terbilang' };
    const v = this.nSum(t);
    return v === null ? null : { kind: 'sum', value: v, sub: q.trim() };
  }
  nWords(n) {
    const one = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    const say = (x) => {
      x = Math.floor(x);
      if (x < 12) return one[x];
      if (x < 20) return `${say(x - 10)} belas`;
      if (x < 100) return `${say(x / 10)} puluh${x % 10 ? ` ${say(x % 10)}` : ''}`;
      if (x < 200) return `seratus${x - 100 ? ` ${say(x - 100)}` : ''}`;
      if (x < 1000) return `${say(x / 100)} ratus${x % 100 ? ` ${say(x % 100)}` : ''}`;
      if (x < 2000) return `seribu${x - 1000 ? ` ${say(x - 1000)}` : ''}`;
      if (x < 1e6) return `${say(x / 1e3)} ribu${x % 1e3 ? ` ${say(x % 1e3)}` : ''}`;
      if (x < 1e9) return `${say(x / 1e6)} juta${x % 1e6 ? ` ${say(x % 1e6)}` : ''}`;
      if (x < 1e12) return `${say(x / 1e9)} miliar${x % 1e9 ? ` ${say(x % 1e9)}` : ''}`;
      return `${say(x / 1e12)} triliun${x % 1e12 ? ` ${say(x % 1e12)}` : ''}`;
    };
    const r = Math.round(Math.abs(n));
    if (r >= 1e15) return '';
    const words = r === 0 ? 'nol' : say(r);
    return n < 0 ? `minus ${words}` : words;
  }
  nCopy(which) {
    const r = this.nRead(this.state.nq || '');
    if (!r) return;
    const text = which === 'words' ? this.nWords(r.value) + (r.kind === 'sum' ? ' rupiah' : '') : r.kind === 'sum' ? this.nRupiah(r.value) : Math.round(r.value).toLocaleString('id-ID');
    try { navigator.clipboard.writeText(text).catch(() => {}); } catch (e) {}
    this.setState({ nCopied: which });
    clearTimeout(this.nCopyT);
    this.nCopyT = setTimeout(() => this.setState({ nCopied: '' }), 1600);
  }
  // Opening Home with something typed in the box (the try-it panel's examples).
  nTry(q) { this.clear(); this.setState({ mode: 'peek', page: 0, pinned: true, nq: q, nCopied: '' }); }

  // ---- what the notch shows ----
  render() {
    const v = this.renderVals();
    return view({ ...v, ...this.notchVals(v) });
  }
  notchVals(v) {
    const s = this.state;
    const mode = s.mode;
    const LEGACY = ['learn', 'clip', 'calc', 'waConnect', 'waSync', 'waIn', 'waChat', 'waAsk', 'blocked', 'undo', 'quiet'];
    const legacy = LEGACY.includes(mode) || (mode === 'peek' && !NPAGES[s.page]) || (mode === 'mini' && s.mini === 'parcel');
    const mmss = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
    const mss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    const left = s.timerLeft / s.timerTotal;
    const fresh = s.timerLeft === s.timerTotal;
    const lyrics = ['Lampu jalan mulai menyala', 'kita pulang lewat jalan yang sama', 'angin sore bawa kabar lama', 'pelan-pelan semua jadi biasa'];
    const li = Math.floor(s.musicPos / 6) % 4;
    // The view, as island.js names it.
    const view = { ask: 'turn', dikteRec: 'turn', notice: 'panel', dikte: 'panel', kredit: 'panel' }[mode] || mode;
    // Dictating: "Mendikte…" in orange while it listens, as island.js shows it (I.mode 'dictation').
    const dikteRec = mode === 'dikteRec';
    const dikteListening = dikteRec && s.dkPhase === 'rec';
    const waiting = mode === 'ask';
    const answering = mode === 'turn' && s.phase === 3;
    // Panels: what main would send for each moment.
    let panel = null;
    if (mode === 'ask') panel = { kind: 'confirm', actions: [['Boleh', 'primary', () => this.answerWith('yes')], ['Boleh semua', '', () => this.answerWith('all')], ['Jangan', 'danger', () => this.answerWith('no')]] };
    if (mode === 'drop') panel = { kind: 'drop', actions: [['Batal', '', () => this.toBase()]] };
    if (mode === 'notice') panel = s.notice === 'upload'
      ? { kind: 'uploaded', title: '✓ Sudah aku upload ke Google Drive.', lines: ['laporan-q4.pdf'], actions: [['Buka', '', () => this.toBase()]] }
      : { kind: 'info', title: s.noticeMsg || '', lines: [], actions: [] };
    if (mode === 'dikte') panel = { kind: 'dictation', title: '✓ Dikte tersimpan', lines: ['1 m 42 d · 186 kata · Indonesia'], note: true, actions: [['Salin', '', () => {}], ['Buka file', '', () => {}], ['Tutup', '', () => this.toBase()]] };
    if (mode === 'kredit') panel = { kind: 'credits', title: 'Kredit habis', lines: ['Notch tetap jalan gratis.'], actions: [['Beli kredit', 'primary', () => {}], ['Nanti', '', () => this.toBase()]] };
    const inPanel = view === 'panel' ? panel : null;
    const panelSub = Boolean(inPanel) && (inPanel.lines || []).length === 1;
    const panelCompact = Boolean(inPanel) && (inPanel.lines || []).length <= 1 && !inPanel.note && (inPanel.actions || []).length <= 2;
    // The mini pill: what is going on, most pressing first.
    const kind = { timer: 'timer', task: 'agents', focus: 'focus', music: 'music' }[s.mini] || 'timer';
    const lyric = kind === 'music' && s.setLyrics !== false ? lyrics[li] : '';
    const [miniText, miniSub] = kind === 'agents' ? ['Dev bekerja', '+1'] : kind === 'timer' ? [mmss(s.timerLeft), s.timerRunning ? 'Fokus' : fresh ? 'Siap' : 'Dijeda']
      : kind === 'focus' ? ['aina-landing', '42 mnt'] : [lyric || 'Senja di Kota', lyric ? '' : 'Nadira'];
    const textW = (t, px) => t.length * px;
    const miniW = Math.max(264, 66 + (kind === 'timer' ? 26 : kind === 'focus' ? 24 : kind === 'agents' ? 16 : 0) + textW(miniText, kind === 'music' ? 7.1 : 7.4) + (miniSub ? 8 + textW(miniSub, 6) : 0));
    // The notch's size and color for each view (island.js: SIZES and the per-view targets).
    const PANEL_W = { dictation: 600, confirm: 600, credits: 440 };
    const size = view === 'rest' ? [132, 28, 14, 8]
      : view === 'mini' ? [miniW, 36, 18, 10]
      : view === 'peek' ? [800, 256, 30, 14]
      : view === 'drop' ? [360, 178, 26, 14]
      : view === 'upload' ? [320, 48, 24, 12]
      : view === 'panel' ? [PANEL_W[inPanel.kind] || 460, panelCompact ? 72 : inPanel.note ? 272 : 120, 26, 14]
      : waiting ? [600, 150, 26, 14]
      : answering ? [600, 132, 26, 14]
      : [600, 72, 26, 14];
    const glow = waiting || dikteListening ? '#ff8a3d'
      : view === 'peek' ? (NPAGES[s.page] || NPAGES[0]).k
      : view === 'mini' ? { timer: '#ff8a3d', music: '#a78bfa', agents: '#f5a524', focus: '#3ddc97' }[kind]
      : view === 'panel' && inPanel.kind === 'credits' ? '#ffb27a'
      : view === 'panel' && (inPanel.kind === 'uploaded' || inPanel.kind === 'dictation') ? '#3ddc97'
      : '#2b8aff';
    const scale = Math.min(1, ((s.mainW || (this.mainEl && this.mainEl.clientWidth) || (window.innerWidth - 288)) - 48) / 800).toFixed(3);
    const open = view !== 'rest' && view !== 'mini';
    const cls = ['pg-notch', 'here', 'has-face', 'hover', open && 'open', 'mode-' + view, (answering || waiting) && 'expanded',
      (waiting || view === 'panel' || view === 'drop') && 'has-panel', waiting && 'waiting', panelSub && 'panel-sub', panelCompact && 'panel-compact',
      view === 'mini' && kind === 'music' && s.playing && 'mini-music', dikteListening && 'dictation'].filter(Boolean).join(' ');
    const w = size[0];
    // The turn row.
    const PH = ['Mendengar…', 'Melihat area…', 'Berpikir…', 'Menjawab…'];
    const rowLabel = dikteRec ? (dikteListening ? 'Mendikte… ' + mss(s.dkSec || 0) : 'Oke…') : waiting ? 'Butuh izinmu' : view === 'panel' ? inPanel.title : PH[s.phase] || 'aina';
    const you = dikteRec ? (!dikteListening ? '' : s.dkHeld ? 'Lepas untuk selesai' : 'Tekan Ctrl + Win lagi untuk selesai · Esc batal')
      : waiting ? 'Jawab dengan suara, Enter, atau Esc' : view === 'panel' ? (panelSub ? inPanel.lines[0] : '') : mode === 'turn' ? '“gimana cara kasih warna otomatis ke sel yang di bawah target?”' : '';
    const say = dikteRec ? '' : waiting ? 'Aku mau hapus kalkulator.html dari folder aina ke Recycle Bin. Boleh?' : this.answer.slice(0, s.typed);
    const waveKind = dikteRec ? (dikteListening ? 'mic' : 'think') : mode === 'turn' ? ['mic', 'think', 'think', 'voice'][s.phase] : waiting ? 'mic' : '';
    const waveBars = Array.from({ length: 18 }, (_, i) => {
      const center = 1 - Math.abs(i - 8.5) / 9;
      return `--a:${(0.35 + 0.6 * center).toFixed(2)};animation-delay:-${((i * 0.137) % 0.9).toFixed(2)}s`;
    });
    // Peek: the clock (the desktop's), the page, its dots.
    const page = NPAGES[s.page] ? s.page : 0;
    const on = this.pagesOn();
    const pid = NPAGES[page].id;
    const nq = s.nq || '';
    const r = this.nRead(nq);
    const words = r ? this.nWords(r.value) : '';
    const tile = (idx, ico, big, main, sub, has, extra = '') => ({ cls: `htile k-${NPAGES[idx].id}${has ? '' : ' none'}${extra}`, k: NPAGES[idx].k, page: NPAGES[idx].id, ico, big, main, sub, onClick: (e) => { e.stopPropagation(); this.setState({ page: idx, pinned: true }); } });
    const row = (time, title, sub, google, next) => ({ cls: `crow st-upcoming${next ? ' next' : ''}`, time, title, sub, src: google ? 'csrc g' : 'csrc l', srcText: google ? 'G' : nIcon('home', 11) });
    const remRows = [row('10.00', 'Standup tim produk', 'Kerja · 25 menit lagi', true, true), row('13.00', 'Kirim laporan Q4', 'Lokal · 3 jam lagi', false), row('15.30', 'Review desain notch', 'Kerja · 5 jam lagi', true)];
    const calCells = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(2026, 9, 26 + i);
      const inMonth = d.getMonth() === 10;
      const n = d.getDate();
      return { n: String(n), cls: `cell${inMonth && n === 4 ? ' on today' : ''}${inMonth ? '' : ' out'}`, dot: inMonth && [4, 6, 11, 12, 18, 25].includes(n) };
    });
    const prayCells = [['Imsak', '03.53'], ['Subuh', '04.03'], ['Terbit', '05.21'], ['Dhuha', '05.48'], ['Dzuhur', '11.39'], ['Ashar', '14.59'], ['Maghrib', '17.52'], ['Isya', '19.04']]
      .map(([name, time], i) => ({ name, time, cls: `pcell${i < 4 ? ' past' : ''}${name === 'Dzuhur' ? ' next' : ''}` }));
    const lyrCls = ['l prev', 'l now', 'l next', 'l'];
    const util = [['Kotak cepat di Home', 'ketik', ''], ['Kalkulator cepat', 'ketik', '15% dari 2.350.000'], ['Terbilang', 'angka', '1.250.000']]
      .map(([label, hint, q]) => ({ label, hint, bg: 'transparent', fg: '#e8ecf2', onClick: () => this.nTry(q) }));
    return {
      legacyNotch: legacy, nOn: !legacy,
      fLearn: FEATURES.learn, fWa: FEATURES.whatsapp, fPrivacy: FEATURES.privacy,
      // With FEATURES.dictation the "Dikte tersimpan" moment becomes a real dictation to try.
      momentItems: (v.momentItems || []).map((it) => it.label !== 'Dikte tersimpan' || !FEATURES.dictation ? it
        : { ...it, label: this.dk ? 'Selesaikan dikte' : 'Coba dikte', hint: 'atau Ctrl + Win', onClick: () => this.dikteClick() }),
      utilItems: FEATURES.clipboard ? [...util, ...(v.utilItems || []).filter((_, i) => i !== 0 && i !== 3)] : util,
      pageItems: (v.pageItems || []).filter((_, i) => pageOn(i)).map((it, n) => ({ ...it, num: String(n + 1).padStart(2, '0') })),
      baseItems: (v.baseItems || []).filter((it) => FEATURES.parcel || !/paket|kurir/i.test(it.label)),
      nCls: cls, nW: w,
      nStyle: `--w:${w}px;--h:${size[1]}px;--r:${size[2]}px;--ear:${size[3]}px;--glow:${glow};--glow-text:${glow === '#2b8aff' ? '#5aa9ff' : glow};--s:${scale}`,
      miniCls: `mini kind-${kind} phase-work${kind === 'music' && s.playing ? ' music' : ''}${lyric ? ' lyric' : ''}${kind === 'timer' && !s.timerRunning ? ' paused' : ''}`,
      miniArtCls: 'mini-art', miniRing: kind === 'timer' ? ringNode(18, 2.4, left) : null, miniIco: kind === 'focus' ? nIcon('folder', 16) : null, miniText, miniSub,
      rowLabel, you, say, sayCls: `say${answering && s.typed < this.answer.length ? ' typing' : ''}`,
      waveCls: `pg-wave ${waveKind}`, waveBars,
      dzIco: nIcon('folder', 44), dzTitle: 'Taruh file-nya di sini', dzHint: 'Bisa beberapa file sekaligus, maksimal 100 MB per file',
      cloudIco: nIcon('cloud', 26), upTitle: 'laporan-q4.pdf', upPct: `${s.upload}%`,
      panelCls: `panel k-${panel ? panel.kind : ''}`,
      pActions: (panel ? panel.actions : []).map(([label, tone, fn]) => ({ label, tone, onClick: (e) => { e.stopPropagation(); fn(); } })),
      pNote: Boolean(panel && panel.note), pNoteSum: 'Notch tampil sebagai jam & cuaca dulu; tawarkan tanya layar setelah tiga hari.',
      pNoteText: 'Pengguna baru sebaiknya langsung lihat notch sebagai jam dan cuaca dulu, tanpa diminta masuk akun. Setelah tiga hari, baru tawarkan coba tanya layar dengan sepuluh kredit gratis. Pomodoro dan jadwal salat jadi alasan orang membuka notch tiap hari, jadi letakkan keduanya di Home.',
      ckH: '09', ckSep: '.', ckM: '41', ckDate: 'Rabu, 4 November', creditsKids: [nIcon('spark', 13), '142 kredit tersisa'],
      pageTitle: this.pages[page], prevOff: on.indexOf(page) <= 0, nextOff: on.indexOf(page) >= on.length - 1,
      dotIdx: Math.max(0, on.indexOf(page)),
      nDots: on.map((i) => {
        const p = NPAGES[i];
        const cur = i === page;
        const live = (p.id === 'timer' && s.timerRunning) || (p.id === 'media' && s.playing) || p.id === 'tasks';
        const name = p.icon[cur ? 1 : 0];
        return { cls: `pdot k-${p.id}${cur ? ' on' : ''}${live ? ' live' : ''}`, label: this.pages[i], icon: /^Io/.test(name) ? nIcon(name, 13) : nIcon(name, 11), onClick: (e) => { e.stopPropagation(); this.setState({ page: i, pinned: true }); } };
      }),
      pg0: pid === 'home', pg1: pid === 'timer', pg2: pid === 'later', pg3: pid === 'prayer', pg4: pid === 'media', pg5: pid === 'focus', pg6: pid === 'library', pg7: pid === 'tasks',
      // Home
      sboxCls: `sbox${s.nqFocus ? ' on' : ''}${nq.trim() ? ' has' : ''}`, sparkIco14: nIcon('spark', 14), nq,
      skind: !nq.trim() ? '' : !r ? '—' : r.kind === 'sum' ? 'Hitung' : 'Terbilang', skindCls: `skind${r ? ' k-' + r.kind : ''}`,
      onNq: (e) => this.setState({ nq: e.target.value, nCopied: '' }),
      onNqKey: (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); if (nq) this.setState({ nq: '' }); else e.target.blur(); }
        if (e.key === 'Enter') this.nCopy('main');
      },
      onNqFocus: () => this.setState({ nqFocus: true, pinned: true }), onNqBlur: () => this.setState({ nqFocus: false }),
      hTiles: !nq.trim(), hAns: Boolean(r), hNone: Boolean(nq.trim()) && !r,
      tiles: [
        tile(2, nIcon('bell', 13), '10.00', 'Standup tim produk', '25 menit lagi', true),
        tile(1, nIcon('timer', 13), mmss(s.timerLeft), 'Fokus', s.timerRunning ? 'Sesi 2 dari 4' : fresh ? 'Siap dimulai' : 'Dijeda', true),
        tile(5, nIcon('folder', 13), '42 mnt', 'aina-landing', 'Fokus aktif', true),
        tile(4, nIcon('music', 13), '', 'Senja di Kota', 'Nadira · Spotify', true, s.playing ? ' playing' : ''),
      ],
      aSub: r ? r.sub : '', aMain: r ? (r.kind === 'sum' ? this.nRupiah(r.value) : Math.round(r.value).toLocaleString('id-ID')) : '',
      aWords: r && words ? (r.kind === 'sum' ? `${words} rupiah` : words) : '',
      c1Cls: s.nCopied === 'main' ? 'chip done' : 'primary', c1Label: s.nCopied === 'main' ? 'Disalin' : 'Salin',
      c2Cls: s.nCopied === 'words' ? 'chip done' : 'chip', c2Label: s.nCopied === 'words' ? 'Disalin' : 'Salin terbilang',
      copyMain: (e) => { e.stopPropagation(); this.nCopy('main'); }, copyWords: (e) => { e.stopPropagation(); this.nCopy('words'); },
      sEx: ['15% dari 2.350.000', 'ppn 11% 1,5jt', '(750rb x 3) : 2', '1.250.000'].map((q) => ({ q, onClick: (e) => { e.stopPropagation(); this.setState({ nq: q }); } })),
      // Timer & pomodoro
      pomoCls: `item widget pomo phase-work${s.timerRunning ? '' : ' paused'}`, dialRing: ringNode(124, 7, left), tCount: mmss(s.timerLeft),
      tState: s.timerRunning ? 'Fokus · 2/4' : fresh ? 'Siap' : 'Dijeda', rounds: ['r done', s.timerRunning ? 'r now' : 'r', 'r', 'r'],
      tPlayKids: s.timerRunning ? withIcon('IoPause', 'Jeda') : withIcon('IoPlay', fresh ? 'Mulai' : 'Lanjut'),
      skipTimer: (e) => { e.stopPropagation(); this.setState((st) => ({ timerLeft: st.timerTotal, timerRunning: false })); },
      stopTimer: (e) => { e.stopPropagation(); this.setState((st) => ({ timerLeft: st.timerTotal, timerRunning: false })); },
      gearIco: nIcon('IoSettingsOutline', 15), flagIco: nIcon('flag', 12), tEnds: 'siklus selesai 11.24',
      // Reminders
      remSeg: [['agenda', 'Agenda'], ['timeline', 'Timeline'], ['calendar', 'Kalender']].map(([k, label]) => ({ label, cls: `chip${(s.remView === 'cal' ? 'calendar' : s.remView) === k ? ' on' : ''}`, onClick: (e) => { e.stopPropagation(); this.setState({ remView: k }); } })),
      remAgenda: !['timeline', 'calendar', 'cal'].includes(s.remView), remTimeline: s.remView === 'timeline', remCal: ['calendar', 'cal'].includes(s.remView),
      remDayNav: !['calendar', 'cal'].includes(s.remView),
      plusIco: nIcon('plus', 15), mosqueIco: nIcon('mosque', 12), remRows,
      calWh: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], calCells,
      // Prayer times
      prayCells,
      // Music
      mediaCls: `item media widget${s.playing ? ' playing' : ''}`, artCls: `art xl${s.playing ? ' playing' : ''}`, musicIco: nIcon('music', 18),
      lyricUnder: !s.nLyr, lyricNow: lyrics[li], lyricCol: Boolean(s.nLyr),
      lyricLines: [li - 1, li, li + 1, li + 2].map((k, j) => ({ cls: lyrCls[j], t: k >= 0 && k < lyrics.length ? lyrics[k] : '' })),
      mPos: mss(s.musicPos), mPct: `${((s.musicPos / s.musicLen) * 100).toFixed(1)}%`,
      shuffleIco: nIcon('IoShuffle', 15), prevIco: nIcon('IoPlaySkipBack', 15), playIco: nIcon(s.playing ? 'IoPause' : 'IoPlay', 15),
      nextIco: nIcon('IoPlaySkipForward', 15), repeatIco: nIcon('IoRepeat', 15), volIco: nIcon('IoVolumeHigh', 15),
      srcKids: withIcon('IoOpenOutline', 'Spotify'), lyrIco: nIcon('IoReaderOutline', 15), headIco: nIcon('IoHeadsetOutline', 15),
      lyrBtnCls: `icon${s.nLyr ? ' on' : ''}`, toggleLyr: (e) => { e.stopPropagation(); this.setState((st) => ({ nLyr: !st.nLyr })); },
      togglePlay: (e) => { e.stopPropagation(); this.setState((st) => ({ playing: !st.playing })); },
      // Focus
      folderIco: nIcon('folder', 16), lockCls: `switch${s.lock ? ' on' : ''}`, lockSub: s.lock ? 'Edit AI hanya di folder ini' : 'Edit AI tidak dikunci',
      fDoneKids: withIcon('IoCheckmark', 'Selesai fokus'), fOpenKids: withIcon('IoFolderOpenOutline', 'Buka folder'), fNoteKids: withIcon('IoCreateOutline', 'Catatan'),
      // Notes & knowledge
      libTiles: [
        { cls: 'htile k-notes', k: '#ffb27a', ico: nIcon('note', 13), big: '12', main: 'Catatan', sub: 'Hasil dikte, tersimpan di Dokumen' },
        { cls: 'htile k-know', k: '#a78bfa', ico: nIcon('book', 13), big: '5', main: 'Pengetahuan', sub: 'File yang kamu drop ke notch' },
      ],
      // Tasks
      openIco: nIcon('open', 15), stopIco: nIcon('IoStop', 15),
    };
  }
