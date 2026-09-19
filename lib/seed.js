const fs = require("fs");
const path = require("path");
const db = require("./db");

/*
 * Seed from the checked-in snapshots generated from JOBDISC_SS3O.xls.
 * Keeping the snapshots as the seed source prevents a fresh installation
 * from silently reintroducing an older, manually-normalized task list.
 *
 * Dipisah dari scripts/seed.js supaya bisa dipakai ulang di 2 tempat:
 *  1) scripts/seed.js — dijalankan manual/lewat npm postinstall & predev.
 *  2) lib/auth.js — dipanggil OTOMATIS tiap ada yang login, khusus kalau
 *     akunnya tidak ketemu. Ini jaga-jaga kalau project baru disambungkan
 *     ke database Postgres yang masih kosong (mis. abis pindah/reset
 *     database di Vercel) — tanpa ini, login bakal terus gagal dengan
 *     "Akun tidak ditemukan" sampai ada yang sadar harus jalanin seed
 *     manual. Dengan ini, begitu ada yang coba login ke database kosong,
 *     datanya otomatis dipulihkan dulu dari snapshot sebelum akun dicari.
 */
const DATA_DIR = path.join(__dirname, "..", "data");
const SEED_TABLES = ["departments", "users", "jobdesks", "kpis"];

function readSnapshot(table) {
  const file = path.join(DATA_DIR, `${table}.json`);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`Gagal membaca snapshot data/${table}.json:`, error.message);
    return [];
  }
}

// Isi database dari snapshot data/*.json HANYA kalau tabel departments/
// users/jobdesks masih benar-benar kosong. Aman dipanggil berkali-kali
// (idempotent) — kalau sudah ada isinya sama sekali tidak menyentuh apa pun.
async function seedIfEmpty() {
  const [departments, users, jobdesks] = await Promise.all([db.all("departments"), db.all("users"), db.all("jobdesks")]);
  if (departments.length || users.length || jobdesks.length) {
    return { seeded: false, reason: "not-empty" };
  }

  const snapshots = Object.fromEntries(SEED_TABLES.map((table) => [table, readSnapshot(table)]));
  if (!snapshots.departments.length || !snapshots.users.length || !snapshots.jobdesks.length) {
    return { seeded: false, reason: "snapshot-incomplete" };
  }

  for (const table of SEED_TABLES) {
    for (const row of snapshots[table]) {
      await db.insert(table, row);
    }
  }

  return {
    seeded: true,
    counts: { users: snapshots.users.length, jobdesks: snapshots.jobdesks.length, kpis: snapshots.kpis?.length || 0 }
  };
}

module.exports = { seedIfEmpty };
