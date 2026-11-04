# aina-web

Halaman landing **aina**: AI assistant dan companion di Windows yang duduk di sebelah kursor, melihat layarmu, dan memandumu dengan menunjuk langsung ke tombolnya.

Ini halaman statis biasa (`index.html`, `style.css`, `script.js`, dan gambar di `img/`), tanpa build.

Desainnya mengikuti `aina Landing.dc.html` dari paket handoff desain aina 1.0. Animasi memakai GSAP 3.12 + ScrollTrigger dari CDN jsDelivr. Tanpa GSAP halaman tetap terbaca, hanya demonya diam.

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

### Deploy otomatis (GitHub Actions)

Setiap push ke `main` otomatis di-deploy oleh `.github/workflows/deploy.yml`. Bisa juga dijalankan manual dari tab **Actions** → **Deploy** → **Run workflow**.

Workflow ini butuh dua secret di GitHub (**Settings** → **Secrets and variables** → **Actions**):

- `CLOUDFLARE_API_TOKEN`: buat di Cloudflare dashboard → **My Profile** → **API Tokens** → template **Edit Cloudflare Workers**.
- `CLOUDFLARE_ACCOUNT_ID`: ada di Cloudflare dashboard → **Workers & Pages**, kolom kanan (atau jalankan `npx wrangler whoami`).
