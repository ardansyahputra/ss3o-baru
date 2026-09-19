const { seedIfEmpty } = require("../lib/seed");

seedIfEmpty()
  .then((result) => {
    if (result.seeded) {
      console.log(
        `✅ Seed SS3O selesai: ${result.counts.users} user, ` +
          `${result.counts.jobdesks} jobdesk, ${result.counts.kpis} KPI.`
      );
    } else if (result.reason === "not-empty") {
      console.log("ℹ️  Data sudah ada, seeding dilewati (sudah pernah jalan sebelumnya).");
    } else {
      console.log("ℹ️  Snapshot SS3O belum lengkap, seeding dilewati.");
    }
  })
  .catch((error) => {
    console.error("❌ Seed gagal:", error.message);
    // Jangan sampai proses `next dev`/`next start` gagal total gara-gara seed
    // error (misal database belum siap) — cukup dilaporkan di log.
  });
