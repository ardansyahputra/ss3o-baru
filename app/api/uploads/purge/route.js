import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { purgeAllUploads, countStoredUploads, getLastPurgedAt, getNextPurgeAt } from "@/lib/retention";

export const dynamic = "force-dynamic";

// Tombol "Hapus Sekarang" di panel retensi — beda dari cron, ini langsung
// hapus semua bukti upload TANPA menunggu jatuh tempo 8 hari, cuma boleh
// dipicu Admin (Dika), bukan LEADER (Aldo/Ilham/Rizki) ataupun staff biasa.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya Admin yang dapat menghapus bukti upload." }, { status: 403 });
  }
  const deletedCount = await purgeAllUploads();
  return NextResponse.json({ ok: true, deletedCount });
}

// Dipakai panel retensi buat refresh status (jumlah tersimpan, terakhir &
// jadwal berikutnya) tanpa reload halaman penuh.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya Admin yang dapat melihat status ini." }, { status: 403 });
  }
  const [storedCount, lastPurgedAt, nextPurgeAt] = await Promise.all([countStoredUploads(), getLastPurgedAt(), getNextPurgeAt()]);
  return NextResponse.json({ ok: true, storedCount, lastPurgedAt, nextPurgeAt });
}
