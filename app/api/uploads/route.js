import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { storeFile } from "@/lib/storage";
import path from "path";
import crypto from "crypto";

const tables = { work: "work_uploads", lxp: "lxp_uploads", dsr: "dsr_uploads" };

export async function POST(request) {
  try {
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
  } catch (error) {
    // Kalau ada langkah di atas yang gagal (mis. koneksi ke storage
    // putus/lambat saat kirim foto dari HP), tanpa try/catch ini Next.js
    // akan mengembalikan halaman error kosong (bukan JSON) — itulah yang
    // bikin muncul "Unexpected end of JSON input" di layar staff. Dengan
    // catch ini, staff selalu dapat pesan JSON yang jelas & bisa coba lagi.
    console.error("Upload gagal:", error);
    return NextResponse.json({ error: "Upload gagal karena masalah koneksi ke server. Coba upload ulang." }, { status: 500 });
  }
}
