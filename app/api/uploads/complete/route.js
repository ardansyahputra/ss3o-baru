import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

const tables = { work: "work_uploads", lxp: "lxp_uploads", dsr: "dsr_uploads" };

// Dipanggil SETELAH file sudah selesai diupload langsung ke Vercel Blob
// dari browser (lihat /api/uploads/blob-token dan UploadView.js). Body di
// sini cuma metadata teks (url, nama file, ukuran, dll) — jadi selalu kecil
// dan tidak akan pernah kena limit ukuran request Vercel, walaupun file
// aslinya besar.
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { type, jobdeskId, date, notes, files } = body || {};
  if (!tables[type] || !Array.isArray(files) || !files.length) {
    return NextResponse.json({ error: "Data upload tidak lengkap." }, { status: 400 });
  }
  const records = [];
  for (const file of files) {
    if (!file.url || !file.fileName) continue;
    records.push(await db.insert(tables[type], {
      userId: session.user.id,
      jobdeskId: jobdeskId || null,
      date: date || new Date().toISOString().slice(0, 10),
      fileName: file.fileName,
      storedName: file.pathname || file.fileName,
      filePath: file.url,
      mimeType: file.mimeType || "application/octet-stream",
      size: file.size || 0,
      source: file.source === "Kamera" ? "Kamera" : "Perangkat",
      notes: notes || null
    }));
  }
  if (!records.length) return NextResponse.json({ error: "Tidak ada file valid untuk disimpan." }, { status: 400 });
  return NextResponse.json({ ok: true, records });
}
