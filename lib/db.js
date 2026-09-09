const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ── Data layer dengan DUA backend ──────────────────────────────────────
//
// 1) Kalau env var POSTGRES_URL ada (otomatis di-inject Vercel begitu
//    project disambungkan ke Vercel Postgres / Neon dari dashboard),
//    semua data disimpan permanen di Postgres. Ini backend yang dipakai
//    saat di-deploy ke Vercel — WAJIB, karena filesystem di Vercel
//    read-only & sementara, jadi file JSON polos TIDAK bisa dipakai
//    untuk simpan data produksi.
//
// 2) Kalau tidak ada POSTGRES_URL (development di laptop biasa, `npm run
//    dev`), tetap pakai file JSON di folder data/ seperti sebelumnya —
//    supaya development sehari-hari tidak perlu install/setup database
//    apa pun, cukup Node.js.
//
// Kedua backend punya method yang sama (all/find/filter/insert/update/
// remove/insertIfNotExists) dan SEMUANYA async (return Promise), supaya
// pemanggilnya (lib/data.js, API routes, halaman-halaman) selalu pakai
// `await db....` tanpa perlu tahu/peduli backend mana yang sedang aktif.

const TABLES = [
  "departments",
  "users",
  "jobdesks",
  "kpis",
  "daily_reports",
  "daily_progress",
  "work_uploads",
  "lxp_uploads",
  "dsr_uploads",
];

function uuid() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

const USE_POSTGRES = Boolean(process.env.POSTGRES_URL);

let db;

if (USE_POSTGRES) {
  // ── Backend Postgres ────────────────────────────────────────────────
  // Semua "tabel" disimpan sebagai baris JSONB di satu tabel fisik
  // `app_data` (kolom table_name membedakan tabel logisnya). Ini supaya
  // struktur data yang fleksibel (persis seperti file JSON sebelumnya,
  // termasuk field-field yang beda-beda tiap baris) tetap bisa dipakai
  // tanpa perlu menulis ulang skema kolom SQL untuk tiap tabel satu-satu.
  const { sql } = require("@vercel/postgres");

  let schemaReady = null;
  function ensureSchema() {
    if (!schemaReady) {
      schemaReady = sql`
        CREATE TABLE IF NOT EXISTS app_data (
          table_name text NOT NULL,
          id text NOT NULL,
          payload jsonb NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (table_name, id)
        )
      `.catch((err) => {
        schemaReady = null;
        throw err;
      });
    }
    return schemaReady;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Neon (terutama tier gratis) auto-suspend kalau nganggur, jadi request
  // PERTAMA setelah idle bisa gagal/timeout saat compute-nya baru "bangun".
  // Retry singkat dengan backoff supaya kegagalan sesaat itu gak langsung
  // muncul sebagai error ke user.
  async function withRetry(fn, attempts = 3) {
    let lastError;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (i < attempts - 1) await sleep(400 * (i + 1));
      }
    }
    throw lastError;
  }

  async function loadTable(table) {
    return withRetry(async () => {
      await ensureSchema();
      const { rows } = await sql`SELECT payload FROM app_data WHERE table_name = ${table} ORDER BY created_at ASC`;
      return rows.map((row) => row.payload);
    });
  }

  async function saveRow(table, row) {
    return withRetry(async () => {
      await ensureSchema();
      await sql`
        INSERT INTO app_data (table_name, id, payload, created_at)
        VALUES (${table}, ${row.id}, ${JSON.stringify(row)}::jsonb, ${row.createdAt || nowIso()})
        ON CONFLICT (table_name, id) DO UPDATE SET payload = EXCLUDED.payload
      `;
    });
  }

  async function deleteRow(table, id) {
    return withRetry(async () => {
      await ensureSchema();
      await sql`DELETE FROM app_data WHERE table_name = ${table} AND id = ${id}`;
    });
  }

  db = {
    uuid,

    /** Ambil semua baris di sebuah tabel. */
    async all(table) {
      return loadTable(table);
    },

    /** Cari satu baris pertama yang cocok predicate, atau null. */
    async find(table, predicate) {
      const rows = await loadTable(table);
      return rows.find(predicate) ?? null;
    },

    /** Ambil semua baris yang cocok predicate. */
    async filter(table, predicate) {
      const rows = await loadTable(table);
      return rows.filter(predicate);
    },

    /** Tambah baris baru. Kalau row.id tidak diisi, otomatis di-generate. */
    async insert(table, row) {
      const record = { id: row.id || uuid(), createdAt: nowIso(), updatedAt: nowIso(), ...row };
      await saveRow(table, record);
      return record;
    },

    /** Update semua baris yang cocok predicate dengan patch. Return jumlah baris yang berubah. */
    async update(table, predicate, patch) {
      const rows = await loadTable(table);
      const matched = rows.filter(predicate);
      for (const row of matched) {
        Object.assign(row, patch, { updatedAt: nowIso() });
        await saveRow(table, row);
      }
      return matched.length;
    },

    /** Hapus semua baris yang cocok predicate. Return jumlah baris yang dihapus. */
    async remove(table, predicate) {
      const rows = await loadTable(table);
      const toRemove = rows.filter(predicate);
      for (const row of toRemove) await deleteRow(table, row.id);
      return toRemove.length;
    },

    /** Insert row baru hanya kalau belum ada baris dengan field=value tsb. */
    async insertIfNotExists(table, field, value, row) {
      const existing = await db.find(table, (r) => r[field] === value);
      if (existing) return existing;
      return db.insert(table, row);
    },
  };
} else {
  // ── Backend file JSON (development lokal) ──────────────────────────
  const DATA_DIR = path.join(process.cwd(), "data");
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Cache in-memory supaya tidak baca file berulang-ulang, tetap disimpan
  // (persist) ke global di dev supaya tidak reset tiap hot-reload Next.js.
  const globalForDb = globalThis;
  const cache = globalForDb.__ss3oDb || {};
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__ss3oDb = cache;
  }

  function filePath(table) {
    return path.join(DATA_DIR, `${table}.json`);
  }

  function load(table) {
    if (cache[table]) return cache[table];
    const fp = filePath(table);
    if (fs.existsSync(fp)) {
      try {
        cache[table] = JSON.parse(fs.readFileSync(fp, "utf8"));
      } catch (err) {
        console.error(`⚠️  Gagal membaca data/${table}.json, dianggap kosong:`, err.message);
        cache[table] = [];
      }
    } else {
      cache[table] = [];
    }
    return cache[table];
  }

  function persist(table) {
    fs.writeFileSync(filePath(table), JSON.stringify(cache[table], null, 2));
  }

  // Pastikan semua file tabel ada & termuat sejak awal.
  for (const t of TABLES) load(t);

  db = {
    uuid,

    async all(table) {
      return load(table);
    },

    async find(table, predicate) {
      return load(table).find(predicate) ?? null;
    },

    async filter(table, predicate) {
      return load(table).filter(predicate);
    },

    async insert(table, row) {
      const rows = load(table);
      const record = { id: row.id || uuid(), createdAt: nowIso(), updatedAt: nowIso(), ...row };
      rows.push(record);
      persist(table);
      return record;
    },

    async update(table, predicate, patch) {
      const rows = load(table);
      let count = 0;
      for (const row of rows) {
        if (predicate(row)) {
          Object.assign(row, patch, { updatedAt: nowIso() });
          count += 1;
        }
      }
      if (count > 0) persist(table);
      return count;
    },

    async remove(table, predicate) {
      const rows = load(table);
      const remaining = rows.filter((r) => !predicate(r));
      const removedCount = rows.length - remaining.length;
      if (removedCount > 0) {
        cache[table] = remaining;
        persist(table);
      }
      return removedCount;
    },

    async insertIfNotExists(table, field, value, row) {
      const existing = await db.find(table, (r) => r[field] === value);
      if (existing) return existing;
      return db.insert(table, row);
    },
  };
}

module.exports = db;
