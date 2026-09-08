import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import path from "path";
import crypto from "crypto";

const tables = { work: "work_uploads", lxp: "lxp_uploads", dsr: "dsr_uploads" };

// Kalau BLOB_READ_WRITE_TOKEN ada (otomatis di-inject Vercel begitu project
// disambungkan ke Vercel Blob dari dashboard), file bukti kerja disimpan di
// Vercel Blob (persisten). Kalau tidak ada (dev lokal di laptop), tetap
// ditulis ke public/uploads seperti sebelumnya. Sama seperti lib/db.js —
// filesystem Vercel read-only & sementara saat runtime, jadi fs.writeFile
// biasa TIDAK bisa dipakai untuk simpan file di produksi.
const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

async function storeFile(file, storedName) {
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${storedName}`, file, { access: "public", addRandomSuffix: false });
    return blob.url;
  }
  const fs = await import("fs/promises");
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, storedName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${storedName}`;
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const files = form.getAll("file").filter((item) => item instanceof File);
  const type = form.get("type");
  if (!files.length || !tables[type]) return NextResponse.json({ error: "File dan tipe dokumen wajib diisi." }, { status: 400 });
  if (files.some((file) => file.size > 10 * 1024 * 1024)) return NextResponse.json({ error: "Setiap file maksimal 10 MB." }, { status: 400 });
  const sources = form.getAll("source");
  const records = [];
  for (const [index, file] of files.entries()) {
    const extension = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "");
    const storedName = `${crypto.randomUUID()}${extension}`;
    const filePath = await storeFile(file, storedName);
    records.push(await db.insert(tables[type], {
      userId: session.user.id,
      jobdeskId: form.get("jobdeskId") || null,
      date: form.get("date") || new Date().toISOString().slice(0, 10),
      fileName: file.name,
      storedName,
      filePath,
      mimeType: file.type,
      size: file.size,
      source: sources[index] === "Kamera" ? "Kamera" : "Perangkat",
      notes: form.get("notes") || null
    }));
  }
  return NextResponse.json({ ok: true, records });
}
