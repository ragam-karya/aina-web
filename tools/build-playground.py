# Builds playground.js and playground.css from the "aina Playground" design export (a DC template and
# its Component class): the template becomes a view(v) function of preact h() calls, and the class
# extends preact's Component. Images and links are mapped to this site (ASSETS, LINKS), and HOOKS add
# the classes the small-screen rules at the end of playground.css use.
#
# Usage, from this folder's parent:
#   python tools/build-playground.py <export.html> playground.js playground.css
# where <export.html> is the design's template with its fonts' @font-face blocks and data: URIs taken
# out (the template inside the "Smart notch UI mockups – aina Playground.html" bundle).
import sys, re, json, html
from html.parser import HTMLParser

src, out_js, out_css = sys.argv[1:4]
text = open(src, encoding='utf-8').read()
lines = text.split('\n')

# ---- the pieces ----
start = next(i for i, l in enumerate(lines) if l.startswith('<div style="position:relative;height:100vh'))
end = next(i for i, l in enumerate(lines) if l.startswith('</x-dc>'))
template = '\n'.join(lines[start:end])

# Hooks for the small-screen rules in playground.css (the design itself is laid out for a desktop).
HOOKS = [
    ('style="position:absolute;z-index:2;left:120px;width:min(calc(100% - 150px),1080px)', 'pg-appwin'),
    ('style="position:absolute;z-index:45;left:16px;bottom:68px', 'pg-hold'),
    ('style="position:absolute;z-index:3;top:40px;left:50%;transform:translateX(-50%);pointer-events:none;animation:hintIn', 'pg-hint'),
    ('style="color:rgba(255,255,255,.75)">· arahkan kursor kalau penasaran', 'pg-hint-mouse'),
    ('style="position:absolute;left:50%;top:190px;margin-left:120px', 'pg-drop'),
    ('style="height:34px;width:150px;padding:0 12px', 'pg-search'),
    ('style="position:absolute;right:16px;display:flex;align-items:center;gap:12px;font-size:12px"', 'pg-tray'),
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

ASSETS = {
    '38dd91e0-f798-459b-b84c-f230c06a0ee9': '/img/aina-mark.png',
    'f116f114-6cee-4afe-8c1d-5bbdcfbbee51': '/img/aina-logo-light.png',
}
LINKS = {
    'aina Landing.dc.html': '/',
    'https://badi-cloud.faisalmashuri16.workers.dev/download': '/api/download',
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
# the render the design tool gave it: the template over renderVals()
logic = logic.rstrip()
assert logic.endswith('}')
logic = logic[:-1].rstrip() + '\n\n  render() {\n    return view(this.renderVals());\n  }\n}\n'

js = '''// aina Playground: a simulated Windows desktop with the aina notch, to try aina in the browser.
// Generated from the "aina Playground" design (Smart notch UI mockups) by tools/build-playground.py: the template
// became view() below and the design's own logic is the Playground class. Edit the design and
// regenerate rather than editing view() by hand.
import { h, render, Component } from 'https://cdn.jsdelivr.net/npm/preact@10.24.3/dist/preact.module.js';

function view(v) {
  return %s;
}

%s
render(h(Playground, null), document.getElementById('playground'));
''' % (view, logic)

open(out_js, 'w', encoding='utf-8', newline='\n').write(js)
SMALL = '''
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
/* No keyboard or mouse: the Ctrl + Alt chip and "move the pointer" hint don't apply; tap the notch,
   or use "Tahan untuk bertanya" in the panel. */
@media (hover: none) {
  .pg-hold { display: none !important; }
  .pg-hint-mouse { display: none !important; }
}
'''

open(out_css, 'w', encoding='utf-8', newline='\n').write(page_css + '\n/* style-hover from the design */\n' + '\n'.join(hover_rules) + '\n' + SMALL)
print('ok', len(js), 'bytes;', len(hover_rules), 'hover rules')
