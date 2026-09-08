# SS3O Staff Administration System

Sistem administrasi dan monitoring jobdesk staff SS3O dengan Next.js App Router, JavaScript, Tailwind CSS, NextAuth, dan data layer existing berbasis file JSON.

## Menjalankan

```bash
npm install
npm start
```

Buka `http://localhost:3000`. Data awal akan dibuat otomatis satu kali oleh `scripts/seed.js` jika folder `data/` masih kosong. Data existing tidak dihapus atau dibuat ulang ketika server dijalankan kembali.

## Akses testing

Password default seluruh akun: `ss3o12345`

- Admin: `aldo@ss3o.com` atau `ilham@ss3o.com`
- Store Leader / Superadmin: `dika@ss3o.com`
- Staff: contoh `ardan@ss3o.com`, `tito@ss3o.com`, `icha@ss3o.com`

## Halaman

- Dashboard menyesuaikan role Admin dan Staff
- Jobdesk Saya, Progress Harian, Report Kerja, Upload Dokumen, dan History
- Staff, Divisi, Jobdesk & KPI, dan Monitoring untuk Admin
- Profile dan Settings

UI menggunakan layout sidebar + topbar yang responsive, empty state untuk data kosong, status/progress visual, serta role-based navigation. Sidebar utama sengaja diringkas menjadi Dashboard, menu administrasi, dan akun; Jobdesk, Progress, Report, Upload, serta History diakses dari panel "Akses cepat aktivitas hari ini" di Dashboard.

Staff dapat mencentang checklist jobdesk harian, menulis report, mengaitkan bukti dengan jobdesk, upload satu atau banyak file, mengambil foto langsung dari kamera, serta memilih kategori Hasil Kerja, LXP, atau DSR Staff. Store Leader/Dika dapat membuka Monitoring Matrix dan History untuk melihat seluruh staff, report, jobdesk terkait, sumber upload Kamera/Perangkat, mengunduh berkas, melakukan approve/revisi/reject, dan mengekspor ringkasan CSV yang kompatibel dengan Excel.

Data jobdesk utama diimpor langsung dari `JOBDISC_SS3O.xls`: 66 tugas utama dari 86 baris jobdesk Excel, termasuk teks lanjutan dan 48 KPI asli. Roster aplikasi berisi 28 akun termasuk Dika. Checklist tersimpan di `daily_progress`, report di `daily_reports`, dan upload di tabel JSON masing-masing sehingga data tetap ada setelah refresh/restart.

## Production check

```bash
npm run build
npm run start:prod
```