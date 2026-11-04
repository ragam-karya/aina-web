# aina-web

Halaman landing **aina**: AI assistant dan companion di Windows yang duduk di sebelah kursor, melihat layarmu, dan memandumu dengan menunjuk langsung ke tombolnya.

Ini halaman statis biasa (`index.html`, `style.css`, `script.js`, dan gambar di `img/`), tanpa build.

## Lihat di komputer sendiri

Buka `index.html` langsung di browser, atau jalankan server statis dari folder ini:

```bash
npx serve .
# atau
python -m http.server 8080
```

## Deploy

Halaman ini di-deploy sebagai Cloudflare Worker (static assets saja) bernama `aina-landing`, lihat `wrangler.jsonc`:

```bash
npx wrangler deploy
```

File yang tidak ikut di-upload ke Cloudflare didaftarkan di `.assetsignore`.
