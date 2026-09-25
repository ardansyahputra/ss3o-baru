import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { POSITION_OPTIONS } from "@/lib/positions";

// staffCode = "ID Staff" yang diketik manual oleh admin (mis. NIP/kode
// internal toko) — TERPISAH dari `id` internal (uuid) yang dipakai sebagai
// primary key di seluruh relasi (jobdesk, upload, report, session login).
// Jadi staffCode aman diubah kapan saja tanpa merusak relasi data staff itu
// di tabel lain — beda dengan `id` yang tidak boleh diubah sama sekali.
function randomPassword() {
  // Password sementara yang mudah dibacakan admin ke staff baru (huruf besar
  // dihindari biar tidak rancu di HP), staff wajib disarankan ganti sendiri
  // lewat menu Settings setelah login pertama.
  return crypto.randomBytes(6).toString("base64url").toLowerCase().slice(0, 8);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  // Struktur pembuatan akun disederhanakan jadi Nama + Email saja —
  // ID staff, department, posisi, dan template jobdesk sifatnya OPSIONAL,
  // bisa langsung diisi di sini kalau mau, atau diatur belakangan dari
  // halaman detail staff (posisi/ID staff/role) & form multi-divisi.
  const emailInput = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const staffCode = typeof body.staffCode === "string" ? body.staffCode.trim() : "";
  const departmentId = typeof body.departmentId === "string" && body.departmentId ? body.departmentId : null;
  const position = typeof body.position === "string" && POSITION_OPTIONS.includes(body.position) ? body.position : "Staff";
  // templateStaffId opsional — kalau diisi, seluruh jobdesk AKTIF milik staff
  // itu (mis. "Junan") disalin jadi jobdesk staff baru ini juga, jadi staff
  // baru tidak perlu diinput ulang jobdesk-nya satu-satu kalau memang sama
  // dengan staff lain di department yang sama.
  const templateStaffId = typeof body.templateStaffId === "string" && body.templateStaffId ? body.templateStaffId : null;

  if (!name) return NextResponse.json({ error: "Nama staff wajib diisi." }, { status: 400 });
  if (!emailInput) return NextResponse.json({ error: "Email staff wajib diisi." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
    return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
  }

  const users = await db.all("users");

  const emailTaken = users.some((item) => (item.email || "").toLowerCase() === emailInput);
  if (emailTaken) return NextResponse.json({ error: `Email "${emailInput}" sudah dipakai staff lain.` }, { status: 400 });

  if (staffCode) {
    const codeTaken = users.some((item) => (item.staffCode || "").toLowerCase() === staffCode.toLowerCase());
    if (codeTaken) return NextResponse.json({ error: `ID staff "${staffCode}" sudah dipakai staff lain.` }, { status: 400 });
  }

  if (departmentId) {
    const department = await db.find("departments", (item) => item.id === departmentId);
    if (!department) return NextResponse.json({ error: "Department tidak ditemukan." }, { status: 400 });
  }

  let templateStaff = null;
  if (templateStaffId) {
    templateStaff = await db.find("users", (item) => item.id === templateStaffId);
    if (!templateStaff) return NextResponse.json({ error: "Staff contoh untuk jobdesk tidak ditemukan." }, { status: 400 });
  }

  const email = emailInput;
  const generatedPassword = randomPassword();
  const passwordHash = await bcrypt.hash(generatedPassword, 12);

  const record = await db.insert("users", {
    name,
    email,
    password: passwordHash,
    role: "STAFF",
    position,
    staffCode: staffCode || null,
    isActive: true,
    departmentId,
    departmentIds: departmentId ? [departmentId] : []
  });

  // Kloning jobdesk dari staff contoh (kalau dipilih) — masing-masing
  // jobdesk dibuat sebagai baris BARU milik staff baru ini (bukan
  // referensi ke jobdesk lama), termasuk KPI-nya, supaya progress/approval
  // staff baru tercatat terpisah dan tidak tercampur dengan staff contoh.
  let clonedJobdeskCount = 0;
  if (templateStaff) {
    const templateJobdesks = await db.filter("jobdesks", (item) => item.userId === templateStaff.id && item.active !== false);
    const allKpis = await db.all("kpis");
    for (const source of templateJobdesks) {
      const newJobdesk = await db.insert("jobdesks", {
        title: source.title,
        description: source.description ?? null,
        priority: source.priority || "MEDIUM",
        active: true,
        departmentId: departmentId || source.departmentId,
        userId: record.id,
        targetCount: source.targetCount ?? null,
        sourceRow: source.sourceRow ?? null,
        sourceDivision: source.sourceDivision ?? null,
        sourceTeam: source.sourceTeam ?? null,
        sourcePerson: name,
        sourceJobdeskNo: source.sourceJobdeskNo ?? null,
        sourceText: source.sourceText ?? null,
        sourceRows: source.sourceRows || [],
        kpis: source.kpis || []
      });
      clonedJobdeskCount += 1;
      const sourceKpis = allKpis.filter((kpi) => kpi.jobdeskId === source.id);
      for (const kpi of sourceKpis) {
        await db.insert("kpis", { jobdeskId: newJobdesk.id, description: kpi.description, target: kpi.target ?? null });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    staff: { id: record.id, name: record.name, email: record.email, staffCode: record.staffCode, position: record.position, departmentId: record.departmentId, departmentIds: record.departmentIds, role: record.role, isActive: true },
    generatedPassword,
    clonedJobdeskCount,
    templateStaffName: templateStaff?.name || null
  });
}
