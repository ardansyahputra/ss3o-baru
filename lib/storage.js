const path = require("path");

// Kalau BLOB_READ_WRITE_TOKEN ada (otomatis di-inject Vercel begitu project
// disambungkan ke Vercel Blob dari dashboard), file bukti kerja disimpan di
// Vercel Blob (persisten). Kalau tidak ada (dev lokal di laptop), tetap
// ditulis ke public/uploads. Sama seperti lib/db.js — filesystem Vercel
// read-only & sementara saat runtime, jadi fs biasa TIDAK bisa dipakai untuk
// simpan file di produksi.
const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// Dipisah dari app/api/uploads/route.js supaya bisa dipakai bareng oleh
// lib/retention.js (buat hapus file fisik saat purge otomatis/manual) tanpa
// duplikasi logic simpan/hapus file.
async function storeFile(file, storedName) {
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${storedName}`, file, { access: "public", addRandomSuffix: false });
    return blob.url;
  }
  const fs = await import("fs/promises");
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, storedName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${storedName}`;
}

// Hapus satu file fisik bukti upload. filePath bisa berupa URL Vercel Blob
// (https://...) ATAU path lokal ("/uploads/xxx"). Dipakai retention/purge —
// sengaja tidak pernah melempar error kalau gagal (file mungkin sudah tidak
// ada / koneksi storage lagi bermasalah), supaya satu file bermasalah tidak
// menghentikan seluruh proses purge.
async function deleteFile(filePath) {
  if (!filePath) return;
  try {
    if (/^https?:\/\//i.test(filePath)) {
      if (USE_BLOB) {
        const { del } = await import("@vercel/blob");
        await del(filePath);
      }
      return;
    }
    const fs = await import("fs/promises");
    const fullPath = path.join(process.cwd(), "public", filePath.replace(/^\//, ""));
    await fs.unlink(fullPath);
  } catch (error) {
    console.error(`⚠️  Gagal menghapus file fisik ${filePath}:`, error.message);
  }
}

// Hapus BANYAK file sekaligus. del() Vercel Blob menerima array URL, jadi
// 1 panggilan API menghapus ratusan file (bukan 1 panggilan per file) —
// ini yang menghemat kuota Blob Operations saat purge 8 harian.
async function deleteFiles(filePaths) {
  const blobUrls = [];
  const localPaths = [];
  for (const filePath of filePaths) {
    if (!filePath) continue;
    if (/^https?:\/\//i.test(filePath)) blobUrls.push(filePath);
    else localPaths.push(filePath);
  }
  if (USE_BLOB && blobUrls.length) {
    const { del } = await import("@vercel/blob");
    for (let i = 0; i < blobUrls.length; i += 500) {
      try {
        await del(blobUrls.slice(i, i + 500));
      } catch (error) {
        console.error("⚠️  Gagal menghapus batch file Blob:", error.message);
      }
    }
  }
  for (const filePath of localPaths) await deleteFile(filePath);
}

module.exports = { storeFile, deleteFile, deleteFiles, usingBlob: () => USE_BLOB };
