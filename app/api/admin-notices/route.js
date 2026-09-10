import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import path from "path";
import crypto from "crypto";

// Backend penyimpanan file sama persis dengan app/api/uploads/route.js —
// dipisah di file ini sendiri (bukan di-import bareng) supaya route upload
// bukti kerja staff yang sudah jalan aman, sama sekali tidak disentuh.
const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

async function storeFile(file, storedName) {
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`admin-notices/${storedName}`, file, { access: "public", addRandomSuffix: false });
    return blob.url;
  }
  const fs = await import("fs/promises");
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, storedName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${storedName}`;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Hanya admin yang bisa mengirim dokumen ke staff." }, { status: 403 });
    const form = await request.formData();
    const notes = (form.get("notes") || "").toString().trim();
    const targetUserId = form.get("targetUserId") || null; // kosong/null = tampil untuk semua staff
    const file = form.get("file");
    const hasFile = file instanceof File && file.size > 0;
    if (!notes && !hasFile) return NextResponse.json({ error: "Isi catatan atau lampirkan file terlebih dahulu." }, { status: 400 });
    if (hasFile && file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File maksimal 10 MB." }, { status: 400 });

    let fileName = null, storedName = null, filePath = null, mimeType = null, size = null;
    if (hasFile) {
      const extension = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "");
      storedName = `${crypto.randomUUID()}${extension}`;
      filePath = await storeFile(file, storedName);
      fileName = file.name;
      mimeType = file.type;
      size = file.size;
    }

    const record = await db.insert("admin_notices", {
      adminId: session.user.id,
      adminName: session.user.name,
      targetUserId: targetUserId || null,
      notes: notes || null,
      fileName,
      storedName,
      filePath,
      mimeType,
      size,
    });
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    console.error("Gagal kirim dokumen ke staff:", error);
    return NextResponse.json({ error: "Gagal mengirim, coba lagi." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
    await db.remove("admin_notices", (row) => row.id === id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Gagal hapus dokumen:", error);
    return NextResponse.json({ error: "Gagal hapus, coba lagi." }, { status: 500 });
  }
}
