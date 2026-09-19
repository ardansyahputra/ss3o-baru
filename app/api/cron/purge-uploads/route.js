import { NextResponse } from "next/server";
import { isPurgeDue, purgeAllUploads } from "@/lib/retention";

// PENTING: route ini dipanggil Vercel Cron sekali sehari (lihat vercel.json).
// Tanpa dua baris export di bawah, Next.js App Router akan menganggap route
// GET ini "statis" (karena tidak baca apa pun dari request) dan MEMBEKUKAN
// hasilnya jadi snapshot saat `next build` — jadi tiap kali di-hit cron,
// yang balik cuma respons dari waktu build, bukan benar-benar menjalankan
// ulang logic purge-nya. `force-dynamic` memaksa route ini selalu dieksekusi
// ulang di server tiap request, dan `revalidate = 0` mematikan cache-nya.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  // Vercel otomatis mengirim header ini di setiap pemanggilan cron resmi.
  // Kalau env var CRON_SECRET diisi, tolak pemanggilan dari luar Vercel.
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await isPurgeDue();
  if (!due) {
    return NextResponse.json({ ok: true, purged: false, message: "Belum jatuh tempo 8 hari sejak terakhir dihapus." });
  }

  const deletedCount = await purgeAllUploads();
  return NextResponse.json({ ok: true, purged: true, deletedCount });
}
