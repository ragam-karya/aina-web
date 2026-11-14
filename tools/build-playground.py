# Builds playground.js and playground.css from the "aina Playground" design export (a DC template and
# its Component class): the template becomes a view(v) function of preact h() calls, and the class
# extends preact's Component. Images and links are mapped to this site (ASSETS, LINKS), and HOOKS add
# the classes the small-screen rules at the end of playground.css use.
#
# Usage, from this folder's parent:
#   python tools/build-playground.py <export.html> playground.js playground.css
# where <export.html> is the design's template with its fonts' @font-face blocks and data: URIs taken
# out (the template inside the "Smart notch UI mockups – aina Playground.html" bundle).
#
# The notch itself is not the design's: it is drawn as aina-notch draws it, so the two look the same.
# Its markup is tools/playground-notch.html, its logic tools/playground-notch.js (with FEATURES, the
# switches for what the notch can do yet), and its styles and icons are read here from aina-notch
# (ui/src/ui/overlay.html, icons.js, reacticons.js), next to this repo or at AINA_NOTCH.
import os, sys, re, json, html
from html.parser import HTMLParser

src, out_js, out_css = sys.argv[1:4]
text = open(src, encoding='utf-8').read()
lines = text.split('\n')
here = os.path.dirname(os.path.abspath(__file__))
notch_root = os.environ.get('AINA_NOTCH') or os.path.join(here, '..', '..', 'aina-notch')
notch_ui = os.path.join(notch_root, 'ui', 'src', 'ui')
if not os.path.isdir(notch_ui):
    raise SystemExit('aina-notch not found at %s (set AINA_NOTCH)' % notch_root)

def notch_file(name):
    return open(os.path.join(notch_ui, name), encoding='utf-8').read()

# The notch's styles: everything for #island in overlay.html (not the page, not the Sprite panel).
overlay = notch_file('overlay.html')
NOTCH_CSS = overlay[overlay.index('  /* Dynamic Island'):overlay.index('  /* Sprite panel')]
# Its icons: the line icons (icons.js, a JS object) and the react-icons it uses (reacticons.js, JSON).
icons_js = notch_file('icons.js')
i0 = icons_js.index('const ICONS = {')
NICONS = icons_js[i0 + len('const ICONS = '):icons_js.index('\n  };', i0) + 4]
react_js = notch_file('reacticons.js')
NREACT = react_js[react_js.index('window.AINA_REACT_ICONS = ') + len('window.AINA_REACT_ICONS = '):].strip().rstrip(';')
json.loads(NREACT)
# The playground's notch: its markup, and its logic in two parts (top of the file, class members).
NOTCH_HTML = open(os.path.join(here, 'playground-notch.html'), encoding='utf-8').read()
notch_js = open(os.path.join(here, 'playground-notch.js'), encoding='utf-8').read()
NOTCH_TOP, NOTCH_MEMBERS = notch_js.split('// ---- class members ----\n')
NOTCH_TOP = NOTCH_TOP.replace('__NICONS__', NICONS.strip()).replace('__NREACT__', NREACT)

# ---- the pieces ----
start = next(i for i, l in enumerate(lines) if l.startswith('<div style="position:relative;height:100vh'))
end = next(i for i, l in enumerate(lines) if l.startswith('</x-dc>'))
template = '\n'.join(lines[start:end])
NOTCH_START = '  <div sc-camel-on-mouse-enter="{{ onEnter }}" sc-camel-on-mouse-leave="{{ onLeave }}"'
assert template.count(NOTCH_START) == 1, 'notch start'
a = template.index(NOTCH_START)
b = template.index('\n</main>', a)
template = (template[:a] + '<sc-if value="{{ legacyNotch }}" hint-placeholder-val="{{ false }}">\n' + template[a:b]
            + '\n</sc-if>\n' + NOTCH_HTML.rstrip() + template[b:])
# The try-it panel's sections for features the notch doesn't have yet: kept, shown by FEATURES.
for title, flag in (('Belajar · menjelaskan sambil mencoret', 'fLearn'),
                    ('WhatsApp</span>\n        <sc-for list="{{ waItems }}"', 'fWa'),
                    ('Privasi</span>\n        <sc-for list="{{ trustItems }}"', 'fPrivacy')):
    at = template.index(title)
    a = template.rindex('\n      <div', 0, at)
    b = template.index('\n      </div>\n', at) + len('\n      </div>')
    assert template[a:b].count('<sc-for') == 1, title
    template = (template[:a] + '\n      <sc-if value="{{ %s }}" hint-placeholder-val="{{ false }}">' % flag
                + template[a:b] + '\n      </sc-if>' + template[b:])

# Hooks for the small-screen rules in playground.css (the design itself is laid out for a desktop).
HOOKS = [
    ('style="position:absolute;z-index:2;left:120px;width:min(calc(100% - 150px),1080px)', 'pg-appwin'),
    ('style="position:absolute;z-index:45;left:16px;bottom:68px', 'pg-hold'),
    ('style="position:absolute;z-index:3;top:40px;left:50%;transform:translateX(-50%);pointer-events:none;animation:hintIn', 'pg-hint'),
    ('style="color:rgba(255,255,255,.75)">· arahkan kursor kalau penasaran', 'pg-hint-mouse'),
    ('style="position:absolute;left:50%;top:190px;margin-left:120px', 'pg-drop'),
    ('style="height:34px;width:150px;padding:0 12px', 'pg-search'),
    ('style="position:absolute;right:16px;display:flex;align-items:center;gap:12px;font-size:12px"', 'pg-tray'),
    # Tanya layar's card in the Coba panel, hidden with the hold chip (pg-hold) while FEATURES.ask is off.
    ('style="display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:14px;background:linear-gradient(160deg,rgba(43,138,255,.2)', 'pg-ask'),
]
for needle, cls in HOOKS:
    assert template.count(needle) == 1, needle
    template = template.replace(needle, 'class="%s" %s' % (cls, needle))
css_start = next(i for i, l in enumerate(lines) if l.startswith('html,body{margin:0;height:100%;background:#14171c'))
css_end = next(i for i, l in enumerate(lines) if i > css_start and l.startswith('</style>'))
page_css = '\n'.join(lines[css_start:css_end])
cls_start = next(i for i, l in enumerate(lines) if l.startswith('class Component extends DCLogic'))
cls_end = max(i for i, l in enumerate(lines) if l.startswith('</script>'))
logic = '\n'.join(lines[cls_start:cls_end])

# The design's examples name the maker's own agents: generic names instead.
AGENTS = [('Nilo', 'General'), ('Ciro', 'Dev')]
for old_name, new_name in AGENTS:
    template = re.sub(r'\b%s\b' % old_name, new_name, template)
    logic = re.sub(r'\b%s\b' % old_name, new_name, logic)
# The design asks with Ctrl + Alt; aina-notch asks with Ctrl + Win (and dictates with Ctrl + Alt): the
# hold chip and the Coba panel's Tanya layar card name Win.
assert template.count('>Alt</span>') == 2, 'Ctrl + Alt chips'
template = template.replace('>Alt</span>', '>Win</span>')
# Edits to the design's logic: the talk and dictation keys go through hotkeyDown/Up (playground-notch.js:
# Ctrl + Win with FEATURES.ask, Ctrl + Alt with FEATURES.dictation, as aina-notch reads them); the
# install steps name no version and no talk keys.
LOGIC_EDITS = [
    ("if ((e.key === 'Control' || e.key === 'Alt') && e.ctrlKey && e.altKey && !e.repeat) { e.preventDefault(); this.holdStart(); }",
     "this.hotkeyDown(e);"),
    ("this.onKeyUp = (e) => { if (e.key === 'Control' || e.key === 'Alt') this.holdEnd(); };", "this.onKeyUp = (e) => this.hotkeyUp(e);"),
    ("this.onBlur = () => this.holdEnd();", "this.onBlur = () => this.hotkeyBlur();"),
    # Dictating (mode dikteRec) is the notch's own view; the design's notch sizes need an entry for it.
    ("    const dims = {\n", "    const dims = { dikteRec: [600, 72, 26],\n"),
    ("['1', 'Buka aina-setup-1.0.0.exe',", "['1', 'Buka installer aina (.exe)',"),
    ("['dikte', 'Dikte tersimpan', 'Ctrl+Win']", "['dikte', 'Dikte tersimpan', 'Ctrl+Alt']"),
    ("['3', 'Tahan Ctrl + Alt, lalu bicara', 'aina melihat layarmu dan menunjuk tempatnya.']",
     "['3', 'Arahkan kursor ke notch', 'Notch di atas layar terbuka saat kursor mendekat.']"),
]
for old_text, new_text in LOGIC_EDITS:
    assert logic.count(old_text) == 1, old_text
    logic = logic.replace(old_text, new_text)

# The notch's page indicator as aina-notch draws it (ui/src/ui/overlay.html, island.js): dots and a pill
# on the open page; hovered, the row widens into each page's icon (outline, filled on the pill), and a
# page whose thing is running (timer, music) keeps a pulsing badge. Styles: .pg-dots in SMALL below.
DOTS_OLD = '''            <div style="display:flex;justify-content:center;gap:5px;padding-top:9px">
              <sc-for list="{{ dots }}" as="d" hint-placeholder-count="8">
                <button sc-camel-on-click="{{ d.onClick }}" title="{{ d.label }}" style="width:{{ d.w }}px;height:6px;border-radius:999px;border:0;padding:0;background:{{ d.bg }};cursor:pointer;transition:width .25s cubic-bezier(.2,.85,.25,1),background .2s ease"></button>
              </sc-for>
            </div>'''
DOTS_NEW = '''            <div class="pg-dots">
              <div class="pg-dtrack" style="--i:{{ pageIdx }}">
                <span class="pg-pind"></span>
                <sc-for list="{{ dots }}" as="d"><button type="button" class="{{ d.cls }}" sc-camel-on-click="{{ d.onClick }}" title="{{ d.label }}" aria-label="{{ d.label }}" aria-current="{{ d.cur }}">{{ d.icon }}</button></sc-for>
              </div>
            </div>'''
assert template.count(DOTS_OLD) == 1, 'dots markup'
template = template.replace(DOTS_OLD, DOTS_NEW)
DOTS_VALS_OLD = "      dots: this.pages.map((label, i) => ({ label, w: i === s.page ? 18 : 6, bg: i === s.page ? '#eef2f8' : 'rgba(255,255,255,.22)', onClick: () => this.setState({ page: i }) })),"
DOTS_VALS_NEW = ("      dots: this.pages.map((label, i) => { const on = i === s.page; const live = PAGE_LIVE[i] && PAGE_LIVE[i](s);"
                 " return { label, cur: on ? 'page' : null, icon: ico(PAGE_ICONS[i][on ? 1 : 0], 13),"
                 " cls: 'pg-pdot' + (on ? ' on' : '') + (live ? ' live k-' + live : ''), onClick: () => this.setState({ page: i }) }; }),\n"
                 "      pageIdx: s.page,")
assert logic.count(DOTS_VALS_OLD) == 1, 'dots values'
logic = logic.replace(DOTS_VALS_OLD, DOTS_VALS_NEW)

icons = json.load(open(__file__.replace('build-playground.py', 'io5-icons.json'), encoding='utf-8'))['icons']
ICON_JS = '''// Page icons (Ionicons 5 from react-icons 5.7.0, MIT; data in tools/io5-icons.json), drawn the way
// react-icons' GenIcon and aina-notch's ainaReactIcon draw them: fill and stroke in currentColor.
const IO5 = %s;
// [at rest, open] per page, in the order of Playground.pages.
const PAGE_ICONS = [
  ['IoHomeOutline', 'IoHome'], ['IoTimerOutline', 'IoTimer'], ['IoNotificationsOutline', 'IoNotifications'],
  ['IoMoonOutline', 'IoMoon'], ['IoMusicalNotesOutline', 'IoMusicalNotes'], ['IoFolderOpenOutline', 'IoFolderOpen'],
  ['IoReaderOutline', 'IoReader'], ['IoSparklesOutline', 'IoSparkles'], ['IoShieldCheckmarkOutline', 'IoShieldCheckmark'],
  ['IoLogoWhatsapp', 'IoLogoWhatsapp'],
];
// A page whose thing is running, and its badge color (k-timer, k-media), as in the notch.
const PAGE_LIVE = { 1: (s) => s.timerRunning && 'timer', 4: (s) => s.playing && 'media' };
const kebab = (k) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
function icoNode(n, root) {
  const a = {};
  if (root) Object.assign(a, { fill: 'currentColor', stroke: 'currentColor', 'stroke-width': '0' });
  for (const [k, v] of Object.entries(n.attr || {})) a[k === 'viewBox' ? k : kebab(k)] = v;
  return h(n.tag, a, (n.child || []).map((c) => icoNode(c, false)));
}
function ico(name, size) {
  const t = IO5[name];
  if (!t) return null;
  const svg = icoNode(t, true);
  Object.assign(svg.props, { width: size, height: size, 'aria-hidden': 'true' });
  return svg;
}
''' % json.dumps(icons, ensure_ascii=False, separators=(',', ':'))

ASSETS = {
    '38dd91e0-f798-459b-b84c-f230c06a0ee9': '/img/aina-mark.png',
    'f116f114-6cee-4afe-8c1d-5bbdcfbbee51': '/img/aina-logo-light.png',
}
LINKS = {
    'aina Landing.dc.html': '/',
    'https://be.aina.ai.id/download': '/api/download',
}
VOID = {'img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'area', 'col', 'embed', 'track', 'wbr'}

# ---- parse into a tree ----
class Node:
    def __init__(self, tag, attrs):
        self.tag, self.attrs, self.kids = tag, attrs, []

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('#root', [])
        self.stack = [self.root]
    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs)
        self.stack[-1].kids.append(n)
        if tag not in VOID:
            self.stack.append(n)
    def handle_startendtag(self, tag, attrs):
        self.stack[-1].kids.append(Node(tag, attrs))
    def handle_endtag(self, tag):
        if tag in VOID:
            return
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return
        raise SystemExit('unbalanced </%s>' % tag)
    def handle_data(self, data):
        self.stack[-1].kids.append(data)

p = P()
p.feed(template)
p.close()

# ---- emit ----
BIND = re.compile(r'\{\{\s*([A-Za-z_$][\w$]*(?:\.[\w$]+)*)\s*\}\}')
hover_rules = []

def ref(path, scope):
    head = path.split('.')[0]
    return path if head in scope else 'v.' + path

def value(s, scope):
    """An attribute or text value: a JS expression."""
    parts, pos = [], 0
    for m in BIND.finditer(s):
        if m.start() > pos:
            parts.append(('s', s[pos:m.start()]))
        parts.append(('e', ref(m.group(1), scope)))
        pos = m.end()
    if pos < len(s):
        parts.append(('s', s[pos:]))
    if len(parts) == 1 and parts[0][0] == 'e':
        return parts[0][1]
    out = []
    for k, x in parts:
        out.append(json.dumps(x, ensure_ascii=False) if k == 's' else '(%s)' % x)
    return ' + '.join(out) if out else '""'

def camel(name):
    a, *b = name.split('-')
    return a + ''.join(w[:1].upper() + w[1:] for w in b)

def attrs_js(n, scope):
    props = []
    hover = None
    for k, val in n.attrs:
        val = '' if val is None else val
        if k.startswith('hint-placeholder'):
            continue
        if k == 'style-hover':
            hover = val
            continue
        if k.startswith('sc-camel-'):
            k = camel(k[len('sc-camel-'):])
        if k in ('src',) and val in ASSETS:
            val = ASSETS[val]
        if k == 'href' and val in LINKS:
            val = LINKS[val]
        props.append((k, value(val, scope)))
    if hover:
        assert '{{' not in hover, hover
        cls = 'hv%d' % len(hover_rules)
        decls = ';'.join(d.strip() + ' !important' for d in hover.split(';') if d.strip())
        hover_rules.append('.%s:hover{%s}' % (cls, decls))
        existing = [i for i, (k, _) in enumerate(props) if k == 'class']
        if existing:
            i = existing[0]
            props[i] = ('class', '%s + " %s"' % (props[i][1], cls))
        else:
            props.append(('class', json.dumps(cls)))
    if not props:
        return 'null'
    return '{' + ', '.join('%s: %s' % (json.dumps(k), v) for k, v in props) + '}'

def kids_js(kids, scope, ind):
    out = []
    for k in kids:
        if isinstance(k, str):
            if not k.strip():
                # whitespace between inline elements matters only when it holds no newline
                if '\n' in k or not k:
                    continue
                out.append(json.dumps(' '))
                continue
            t = re.sub(r'\s*\n\s*', ' ', k)
            out.append(value(t, scope))
        else:
            out.append(node_js(k, scope, ind))
    return out

def node_js(n, scope, ind=0):
    pad = '  ' * ind
    if n.tag == 'sc-if':
        cond = value(dict(n.attrs)['value'], scope)
        body = kids_js(n.kids, scope, ind + 1)
        return '(%s) ? [%s] : null' % (cond, (',\n' + pad + '  ').join(body))
    if n.tag == 'sc-for':
        a = dict(n.attrs)
        lst = value(a['list'], scope)
        var = a['as']
        body = kids_js(n.kids, scope | {var}, ind + 1)
        return '(%s || []).map((%s) => [%s])' % (lst, var, (',\n' + pad + '  ').join(body))
    kids = kids_js(n.kids, scope, ind + 1)
    args = [json.dumps(n.tag), attrs_js(n, scope)] + kids
    return 'h(' + (',\n' + pad + '  ').join(args) + ')'

roots = [k for k in p.root.kids if not isinstance(k, str)]
assert len(roots) == 1, len(roots)
view = node_js(roots[0], set(), 1)

logic = logic.replace('class Component extends DCLogic {', 'class Playground extends Component {', 1)
# the notch's members, with the render: the template over renderVals() and the notch's own values
logic = logic.rstrip()
assert logic.endswith('}')
logic = logic[:-1].rstrip() + '\n\n' + NOTCH_MEMBERS.rstrip() + '\n}\n'

js = '''// aina Playground: a simulated Windows desktop with the aina notch, to try aina in the browser.
// Generated from the "aina Playground" design (Smart notch UI mockups) by tools/build-playground.py: the template
// became view() below and the design's own logic is the Playground class. Edit the design and
// regenerate rather than editing view() by hand.
import { h, render, Component } from 'https://cdn.jsdelivr.net/npm/preact@10.24.3/dist/preact.module.js';

%s
%s
function view(v) {
  return %s;
}

%s
render(h(Playground, null), document.getElementById('playground'));
''' % (ICON_JS, NOTCH_TOP, view, logic)

open(out_js, 'w', encoding='utf-8', newline='\n').write(js)
NOTCH_PLACE = '''
/* The notch as aina-notch draws it (its styles above, from ui/src/ui/overlay.html), on the playground's
   desktop instead of fixed at the top of a screen, scaled to fit, its size eased by CSS (the app springs it). */
#island.pg-notch.here { position: absolute; z-index: 5; pointer-events: auto; transform: translateX(-50%) scale(var(--s, 1)); transform-origin: top center;
  transition: width .46s cubic-bezier(.34, 1.22, .6, 1), height .46s cubic-bezier(.34, 1.22, .6, 1), opacity .25s ease; }
#island.pg-notch .shape { transition: border-radius .46s cubic-bezier(.34, 1.22, .6, 1), box-shadow .3s ease; }
/* aina (a Rive animation in the app) as a still. */
#island img.pg-face { display: block; flex: none; width: 42px; height: 42px; object-fit: contain; }
#island .peek-mascot img.pg-face { width: 60px; height: 60px; }
#island .mini-art img.pg-face { position: absolute; left: -2px; top: -2px; width: 28px; height: 28px; }
/* The voice wave (a canvas in the app). */
#island .pg-wave { display: flex; align-items: center; gap: 2px; height: 18px; flex: none; }
#island .pg-wave i { width: 2.5px; height: 18px; border-radius: 2px; background: var(--glow-text, #5aa9ff); transform: scaleY(.18); }
#island .pg-wave.mic i, #island .pg-wave.voice i { animation: pg-wave .9s ease-in-out infinite; }
#island .pg-wave.think i { opacity: .6; animation: pg-wave 1.8s ease-in-out infinite; }
#island.mode-panel .pg-wave { display: none; }
@keyframes pg-wave { 0%, 100% { transform: scaleY(.18); } 50% { transform: scaleY(var(--a, .8)); } }
/* The drop zone's and the upload's pictures (Lottie animations in the app). */
#island .pg-dzico { display: grid; color: #5aa9ff; }
#island .pg-cloud { display: grid; flex: none; color: #8fb8ff; }
'''

SMALL = '''
/* Features of the design's page that are off (FEATURES in tools/playground-notch.js) */
.no-ask .pg-hold,.no-ask .pg-ask{display:none !important}
/* The notch's page indicator, as in aina-notch (overlay.html: .peek .dots). */
.pg-dots { display: flex; justify-content: center; padding-top: 7px; --slot: 14px; --pop: cubic-bezier(.34, 1.5, .6, 1); }
.pg-dots:hover { --slot: 30px; }
.pg-dtrack { position: relative; display: flex; }
.pg-pind { position: absolute; left: 1px; top: 50%; width: calc(var(--slot) - 2px); height: 5px; border-radius: 999px; background: #eef2f8; transform: translate(calc(var(--i, 0) * var(--slot)), -50%); transition: transform .44s cubic-bezier(.34, 1.4, .5, 1), width .3s var(--pop), height .3s var(--pop); }
.pg-dots:hover .pg-pind { height: 20px; }
.pg-pdot { position: relative; z-index: 1; width: var(--slot); height: 20px; display: grid; place-items: center; cursor: pointer; color: #8e9bb0; border: 0; padding: 0; background: none; transition: width .3s var(--pop), color .18s ease; }
.pg-pdot::before { content: ""; position: absolute; width: 5px; height: 5px; border-radius: 50%; background: color-mix(in srgb, #8e9bb0 75%, transparent); transition: opacity .18s ease, transform .3s var(--pop); }
.pg-pdot > * { opacity: 0; transform: scale(.5); transition: opacity .18s ease, transform .3s var(--pop); }
.pg-dots:hover .pg-pdot::before, .pg-pdot.on::before { opacity: 0; transform: scale(.4); }
.pg-dots:hover .pg-pdot > * { opacity: 1; transform: none; }
.pg-dots:hover .pg-pdot:hover { color: #eef2f8; }
.pg-pdot.on { color: #000 !important; }
.pg-pdot:focus-visible { outline: 2px solid #5aa9ff; outline-offset: 1px; border-radius: 6px; }
.pg-pdot.live::before { background: var(--k); }
.pg-pdot.k-timer { --k: #ff8a3d; }
.pg-pdot.k-media { --k: #a78bfa; }
.pg-pdot.live::after { content: ""; position: absolute; top: -1px; right: 2px; width: 6px; height: 6px; border-radius: 50%; background: var(--k); box-shadow: 0 0 0 2px #000, 0 0 6px var(--k); animation: pulse 1.6s ease-in-out infinite; }
.pg-dots:not(:hover) .pg-pdot.live::after { display: none; }

/* Phones and touch screens (not in the design, which is laid out for a desktop). The pg-* classes are
   hooks tools/build-playground.py adds; !important beats the design's inline styles. */
@media (max-width: 640px) {
  [aria-label="Ikon desktop"] { display: none !important; }
  .pg-appwin { left: 8px !important; width: calc(100% - 16px) !important; top: 64px !important; bottom: 120px !important; }
  .pg-drop { left: auto !important; right: 16px !important; margin-left: 0 !important; }
  .pg-search, .pg-tray, .pg-hold, .pg-hint-mouse { display: none !important; }
  .pg-hint { top: 34px !important; left: 12px !important; right: 12px !important; transform: none !important; display: flex; justify-content: center; }
  .pg-hint > div > span { white-space: normal !important; text-align: center; }
}
/* No keyboard or mouse: the Ctrl + Win chip and "move the pointer" hint don't apply; tap the notch,
   or use "Tahan untuk bertanya" in the panel. */
@media (hover: none) {
  /* Nothing to hover: the icons stay out, so the pages can be told apart and tapped. */
  .pg-dots { --slot: 30px; }
  .pg-dots .pg-pind { height: 20px; }
  .pg-dots .pg-pdot::before { opacity: 0; }
  .pg-dots .pg-pdot > * { opacity: 1; transform: none; }
  .pg-dots:not(:hover) .pg-pdot.live::after { display: block; }
  .pg-hold { display: none !important; }
  .pg-hint-mouse { display: none !important; }
}
'''

open(out_css, 'w', encoding='utf-8', newline='\n').write(page_css + '\n/* style-hover from the design */\n' + '\n'.join(hover_rules) + '\n' + SMALL
                                                             + '\n/* ---- the notch, from aina-notch ---- */\n' + NOTCH_CSS + NOTCH_PLACE)
print('ok', len(js), 'bytes;', len(hover_rules), 'hover rules')
