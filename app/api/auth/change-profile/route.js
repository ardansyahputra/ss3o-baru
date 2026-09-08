import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!name || !email) {
    return NextResponse.json({ error: "Username dan email wajib diisi." }, { status: 400 });
  }
  if (name.length < 2) {
    return NextResponse.json({ error: "Username minimal 2 karakter." }, { status: 400 });
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
  }

  const user = await db.find("users", (item) => item.id === session.user.id);
  if (!user || user.isActive === false) {
    return NextResponse.json({ error: "Akun tidak ditemukan atau nonaktif." }, { status: 404 });
  }

  const emailTaken = await db.find("users", (item) => item.email === email && item.id !== session.user.id);
  if (emailTaken) {
    return NextResponse.json({ error: "Email sudah dipakai akun lain." }, { status: 409 });
  }

  const updated = await db.update("users", (item) => item.id === session.user.id, { name, email });
  if (!updated) {
    return NextResponse.json({ error: "Profil gagal disimpan." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Username dan email berhasil diubah.", name, email });
}
