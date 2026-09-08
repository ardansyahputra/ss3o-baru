import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi login tidak ditemukan." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format request tidak valid." }, { status: 400 });
  }

  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: "Semua field password wajib diisi." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password baru minimal 8 karakter." }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Konfirmasi password baru belum sama." }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "Password baru harus berbeda dari password lama." }, { status: 400 });
  }

  const user = await db.find("users", (item) => item.id === session.user.id);
  if (!user || user.isActive === false) {
    return NextResponse.json({ error: "Akun tidak ditemukan atau nonaktif." }, { status: 404 });
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatches) {
    return NextResponse.json({ error: "Password lama tidak sesuai." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const updated = await db.update("users", (item) => item.id === session.user.id, { password: passwordHash });
  if (!updated) {
    return NextResponse.json({ error: "Password gagal disimpan." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Password berhasil diubah. Session aktif tetap berjalan." });
}