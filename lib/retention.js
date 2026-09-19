const db = require("./db");
const { deleteFile } = require("./storage");

// Tabel yang isinya BUKTI upload (foto Hasil Kerja/LXP/DSR) — cuma ini yang
// disentuh retention. Data staff, jobdesk, dan daily_reports TIDAK PERNAH
// ikut dihapus oleh fitur ini.
const UPLOAD_TABLES = ["work_uploads", "lxp_uploads", "dsr_uploads"];

const RETENTION_DAYS = 8;

// Satu baris meta disimpan di tabel "system_meta" (dipakai db.js apa adanya,
// tidak perlu skema baru) buat nyatet kapan terakhir kali purge jalan.
const META_TABLE = "system_meta";
const META_ID = "upload_retention";

async function getMeta() {
  return db.find(META_TABLE, (item) => item.id === META_ID);
}

// Kapan terakhir semua bukti upload dihapus. null kalau belum pernah purge
// sama sekali sejak fitur ini ada.
async function getLastPurgedAt() {
  const meta = await getMeta();
  return meta?.lastPurgedAt || null;
}

// Jadwal purge berikutnya = RETENTION_DAYS hari setelah terakhir dihapus.
// Kalau belum pernah purge sama sekali, dianggap sudah "jatuh tempo" dari
// sekarang, supaya siklus pertama langsung berjalan wajar.
async function getNextPurgeAt() {
  const lastPurgedAt = await getLastPurgedAt();
  if (!lastPurgedAt) return new Date().toISOString();
  const next = new Date(lastPurgedAt);
  next.setDate(next.getDate() + RETENTION_DAYS);
  return next.toISOString();
}

async function isPurgeDue() {
  const nextPurgeAt = await getNextPurgeAt();
  return new Date(nextPurgeAt).getTime() <= Date.now();
}

// Total bukti upload yang masih tersimpan sekarang (dipakai panel admin).
async function countStoredUploads() {
  let total = 0;
  for (const table of UPLOAD_TABLES) total += (await db.all(table)).length;
  return total;
}

// Hapus SEMUA bukti upload (bukan cuma yang lebih tua dari RETENTION_DAYS
// hari) — sengaja begitu, supaya storage Blob/Postgres benar-benar bersih
// tiap siklus 8 hari, bukan cuma dipangkas sebagian. Data staff, jobdesk,
// dan report TIDAK ikut kehapus. Dipanggil baik oleh cron harian (kalau
// sudah jatuh tempo) maupun tombol "Hapus Sekarang" admin (langsung, tanpa
// cek jatuh tempo).
async function purgeAllUploads() {
  let deletedCount = 0;
  for (const table of UPLOAD_TABLES) {
    const rows = await db.all(table);
    for (const row of rows) {
      await deleteFile(row.filePath);
      await db.remove(table, (item) => item.id === row.id);
      deletedCount += 1;
    }
  }

  const nowIso = new Date().toISOString();
  const meta = await getMeta();
  if (meta) await db.update(META_TABLE, (item) => item.id === META_ID, { lastPurgedAt: nowIso });
  else await db.insert(META_TABLE, { id: META_ID, lastPurgedAt: nowIso });

  return deletedCount;
}

module.exports = {
  RETENTION_DAYS,
  getLastPurgedAt,
  getNextPurgeAt,
  isPurgeDue,
  countStoredUploads,
  purgeAllUploads
};
