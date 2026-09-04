# Katalog QR — Rumah Dessert Dapur Ibu

Katalog dessert digital. Pelanggan scan QR → terus masuk katalog, tanpa install app.
Ibu urus semua produk, stok dan setting melalui **admin.html**.

## Struktur fail

```
index.html          ← halaman katalog pelanggan (QR landing page)
admin.html           ← dashboard admin (login diperlukan)
css/style.css        ← semua styling
js/supabase-config.js ← ISI SUPABASE URL & ANON KEY DI SINI
js/catalog.js         ← logik halaman pelanggan
js/admin.js           ← logik dashboard admin
schema.sql             ← skrip untuk setup database Supabase
manifest.json           ← PWA manifest
```

Tiada proses "build" — semua fail HTML/CSS/JS terus boleh dibuka di browser
atau di-upload ke GitHub Pages, sama seperti app Ibu yang lain.

---

## LANGKAH 1 — Setup Supabase (sekali sahaja)

1. Pergi ke [supabase.com](https://supabase.com) → buat project baru (percuma).
2. Dalam project, buka **SQL Editor** → tampal seluruh kandungan `schema.sql` → **Run**.
   Ini akan buat semua jadual (products, categories, settings), storage bucket
   untuk gambar, RLS security, dan demo data.
3. Buka **Project Settings → API**. Salin:
   - **Project URL**
   - **anon public key**
4. Buka `js/supabase-config.js`, gantikan:
   ```js
   const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
   ```
   dengan nilai sebenar dari langkah 3.

## LANGKAH 2 — Buat akaun Admin (login)

1. Dalam Supabase Dashboard → **Authentication → Users → Add user**.
2. Masukkan email dan password Ibu sendiri (untuk login ke admin.html).
3. Simpan email/password ini — ini yang Ibu guna untuk log masuk di `admin.html`.

## LANGKAH 3 — Upload ke GitHub Pages

Sama seperti app-app Ibu yang lain:

1. Buat repo baru di GitHub (contoh: `katalog-dapur-ibu`).
2. "Upload files" → drag semua fail dalam folder ini (kekalkan struktur folder `css/` dan `js/`).
3. Settings → Pages → pilih branch `main`, folder `/ (root)` → Save.
4. Selepas beberapa minit, katalog Ibu akan hidup di:
   `https://sitiasmah72-rgb.github.io/katalog-dapur-ibu/`

Admin dashboard: tambah `/admin.html` di hujung URL tersebut.

> Boleh juga deploy ke Vercel jika mahu (drag folder ini ke vercel.com/new),
> tapi GitHub Pages lebih ringkas kerana tak perlu build step.

## LANGKAH 4 — Setup dari Admin Dashboard

1. Buka `admin.html`, log masuk.
2. Tab **Settings** → isi nombor WhatsApp, alamat, waktu operasi, social media.
3. Tab **Kategori** → tambah/edit kategori mengikut keperluan.
4. Tab **Produk** → edit demo product, upload gambar sebenar, betulkan harga & stock.
5. Tab **QR Code** → download PNG/SVG atau print terus untuk sticker/poster.

## Cara guna harian

- **Tambah produk baru**: Tab Produk → "Add New Product" → isi & save.
- **Update stock cepat**: guna butang `+` / `−` di senarai produk.
- **Tandakan Sold Out / Available**: guna dropdown status di sebelah stock.
  (Bila stock quantity = 0 dan "Auto stock status" dihidupkan, status jadi SOLD OUT
  secara automatik — Ibu tak perlu buat apa-apa.)
- **Featured / Today's Special**: buka produk → hidupkan toggle "Today's Special".
- **Seasonal item (Raya, Merdeka dll)**: hidupkan toggle "Seasonal / Limited",
  dan padamkan toggle "Display di katalog" bila tidak musim lagi (tak perlu delete).

## Nota keselamatan

- Anon key dalam `supabase-config.js` **selamat** untuk didedahkan — ia direka begitu.
  Keselamatan sebenar dikawal oleh Row Level Security (RLS): sesiapa boleh **baca**
  katalog, tapi hanya admin yang **log masuk** boleh ubah data.
- Jangan kongsi password admin. Boleh tukar/reset di Supabase Dashboard → Authentication.

## Untuk masa depan (belum dibina, tapi struktur sedia untuknya)

Online ordering + cart, payment, delivery/pickup, customer reviews, promo code,
sales tracking, best seller, customer database — boleh ditambah kemudian tanpa
perlu bina semula struktur sedia ada.
