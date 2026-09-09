import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Route ini TIDAK menerima file sama sekali — cuma mengeluarkan "izin"
// (token) supaya browser staff bisa upload file besar LANGSUNG ke Vercel
// Blob, tanpa lewat Serverless Function kita sama sekali. Ini satu-satunya
// cara resmi melewati batas 4,5 MB per-request punya Vercel, karena batas
// itu berlaku di level platform dan tidak bisa diubah lewat kode/env var.
//
// Kalau BLOB_READ_WRITE_TOKEN belum di-set di server (mis. dev lokal tanpa
// Blob), route ini akan gagal — di UploadView.js, kegagalan ini otomatis
// fallback ke upload cara lama (langsung POST ke /api/uploads).
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB per file

export async function POST(request) {
  const body = await request.json();
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await getServerSession(authOptions);
        if (!session?.user) throw new Error("Unauthorized");
        return {
          allowedContentTypes: [
            "image/*",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
          ],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Metadata record (jobdeskId, notes, dll) disimpan lewat panggilan
        // terpisah ke /api/uploads/complete langsung dari client setelah
        // upload() selesai — lihat UploadView.js. Tidak perlu apa-apa di sini.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
