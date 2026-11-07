# aina-web

Halaman landing **aina**: AI assistant dan companion di Windows yang duduk di sebelah kursor, melihat layarmu, dan memandumu dengan menunjuk langsung ke tombolnya.

Ini halaman statis biasa (`index.html`, `style.css`, `script.js`, dan gambar di `img/`), tanpa build.

Halaman akun juga ada di sini: `masuk.html`, `langganan.html`, dan `terima-kasih.html` (dengan `account.css` dan `account.js`), dibuka sebagai `/masuk`, `/langganan`, `/terima-kasih`. Halaman-halaman ini memanggil aina Cloud (Worker `badi-cloud`, repo `aina-backend`) lewat `/api/*`. `worker.js` meneruskan `/api/*` ke `badi-cloud` lewat service binding, jadi browser hanya bicara dengan domain ini dan cookie sesi `badi_session` tersimpan di sini. Login Google tetap kembali lewat callback `badi-cloud` (redirect URI di Google Console tidak berubah), lalu ke `/api/auth/finish`.

Desainnya mengikuti `aina Landing.dc.html` dari paket handoff desain aina 1.0. Animasi memakai GSAP 3.12 + ScrollTrigger dari CDN jsDelivr. Tanpa GSAP halaman tetap terbaca, hanya demonya diam.

Playground (`/playground`: `playground.html`, `playground.js`, `playground.css`) adalah simulasi desktop Windows dengan notch aina untuk dicoba di browser. `playground.js` dan `playground.css` dibuat dari desain "aina Playground" oleh `tools/build-playground.py` (Preact dari CDN, tanpa build). Ubah desainnya lalu jalankan ulang skrip itu, jangan edit `view()` dengan tangan. Di layar HP, aturan di akhir `playground.css` merapikan tata letaknya dan `playground.html` menampilkan pemberitahuan sekali bahwa halaman ini paling pas di laptop atau PC.

## Lihat di komputer sendiri

Buka `index.html` langsung di browser, atau jalankan server statis dari folder ini:

```bash
npx serve .
# atau
python -m http.server 8080
```

Halaman akun (`/masuk`, `/langganan`, `/terima-kasih`) butuh `/api`, jadi jalankan dengan Wrangler: `npx wrangler dev` di `aina-backend/cloud` dulu, lalu `npx wrangler dev` di folder ini (service binding ke `badi-cloud` tersambung otomatis antar sesi dev lokal).

## Deploy

Halaman ini di-deploy sebagai Cloudflare Worker bernama `aina-landing` (static assets, plus `worker.js` untuk `/api/*`), lihat `wrangler.jsonc`. Worker `badi-cloud` harus sudah ada di akun Cloudflare yang sama karena dipakai lewat service binding `API`:

```bash
npx wrangler deploy
```

File yang tidak ikut di-upload ke Cloudflare didaftarkan di `.assetsignore`.

### Deploy otomatis (GitHub Actions)

Setiap push ke `main` otomatis di-deploy oleh `.github/workflows/deploy.yml`. Bisa juga dijalankan manual dari tab **Actions** → **Deploy** → **Run workflow**.

Workflow ini butuh dua secret di GitHub (**Settings** → **Secrets and variables** → **Actions**):

- `CLOUDFLARE_API_TOKEN`: buat di Cloudflare dashboard → **My Profile** → **API Tokens** → template **Edit Cloudflare Workers**.
- `CLOUDFLARE_ACCOUNT_ID`: ada di Cloudflare dashboard → **Workers & Pages**, kolom kanan (atau jalankan `npx wrangler whoami`).
