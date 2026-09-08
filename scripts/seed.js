const fs = require("fs");
const path = require("path");
const db = require("../lib/db");

/*
 * Seed from the checked-in snapshots generated from JOBDISC_SS3O.xls.
 * Keeping the snapshots as the seed source prevents a fresh installation
 * from silently reintroducing an older, manually-normalized task list.
 */
const DATA_DIR = path.join(__dirname, "..", "data");
const tables = ["departments", "users", "jobdesks", "kpis"];

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

async function seed() {
  const [departments, users, jobdesks] = await Promise.all([db.all("departments"), db.all("users"), db.all("jobdesks")]);
  if (departments.length || users.length || jobdesks.length) {
    console.log("ℹ️  Data sudah ada, seeding dilewati (sudah pernah jalan sebelumnya).");
    return;
  }

  const snapshots = Object.fromEntries(tables.map((table) => [table, readSnapshot(table)]));
  if (!snapshots.departments.length || !snapshots.users.length || !snapshots.jobdesks.length) {
    console.log("ℹ️  Snapshot SS3O belum lengkap, seeding dilewati.");
    return;
  }

  for (const table of tables) {
    for (const row of snapshots[table]) {
      await db.insert(table, row);
    }
  }

  console.log(
    `✅ Seed SS3O selesai: ${snapshots.users.length} user, ` +
      `${snapshots.jobdesks.length} jobdesk, ${snapshots.kpis.length} KPI.`
  );
}

seed().catch((error) => {
  console.error("❌ Seed gagal:", error.message);
  // Jangan sampai proses `next dev`/`next start` gagal total gara-gara seed
  // error (misal database belum siap) — cukup dilaporkan di log.
});