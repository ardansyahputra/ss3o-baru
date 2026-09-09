import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

// Menyajikan kembali isi file bukti kerja yang disimpan lewat db.files
// (POST /api/uploads). Butuh login (sama seperti route upload lainnya) —
// dipakai langsung sebagai <img src>/<a href download> di halaman Upload,
// Monitoring, dan History, dan otomatis mengirim cookie sesi karena
// same-origin.
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = await db.files.get(params.name);
  if (!file || !file.data) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });

  const safeName = (file.filename || params.name).replace(/"/g, "");
  // Pastikan body berupa Uint8Array biner asli (bukan string/objek lain)
  // sebelum dikirim, supaya preview gambar tidak pernah gagal terbaca
  // gara-gara bentuk data yang tidak konsisten dari layer db.
  const body = Buffer.isBuffer(file.data) ? new Uint8Array(file.data) : new Uint8Array(Buffer.from(file.data));
  return new NextResponse(body, {
    headers: {
      "Content-Type": file.mimetype || "application/octet-stream",
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, max-age=31536000, immutable"
    }
  });
}
