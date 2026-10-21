import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

// SEMENTARA, buat cek deploy: buka /api/health. Cuma menampilkan ada/tidaknya
// env var (tanpa nilainya). HAPUS file ini setelah login berhasil.
export async function GET() {
  let departments = null;
  let dbError = null;
  try {
    departments = (await db.all("departments")).length;
  } catch (error) {
    dbError = String(error.message || error).slice(0, 120);
  }
  return NextResponse.json({
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
    POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
    BLOB_READ_WRITE_TOKEN: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    departments,
    dbError
  });
}
