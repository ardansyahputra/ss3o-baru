import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { POSITION_OPTIONS } from "@/lib/positions";
import { departmentMembership } from "@/lib/roles";

const ROLE_OPTIONS = ["ADMIN", "LEADER", "STAFF"];

// Dipakai StaffPositionForm.js & StaffRoleForm.js di halaman Staff Detail
// (admin/2nd Leader) untuk ganti posisi/jabatan dan role staff lewat
// dropdown — bukan ketik bebas lagi, supaya penulisannya selalu konsisten
// (mis. tidak ada "Area manager" vs "AREA MANAGER" vs "area mngr" untuk
// staff berbeda-beda).
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const staff = await db.find("users", (item) => item.id === params.id);
  if (!staff) return NextResponse.json({ error: "Staff tidak ditemukan." }, { status: 404 });

  const patch = {};

  if (body.position !== undefined) {
    const position = typeof body.position === "string" ? body.position.trim() : "";
    if (!position || !POSITION_OPTIONS.includes(position)) {
      return NextResponse.json({ error: "Posisi tidak valid." }, { status: 400 });
    }
    patch.position = position;
  }

  if (body.role !== undefined) {
    const role = typeof body.role === "string" ? body.role.trim().toUpperCase() : "";
    if (!ROLE_OPTIONS.includes(role)) {
      return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
    }
    // Jangan sampai admin terakhir malah diturunkan (ke Staff atau 2nd
    // Leader) sampai tidak ada satu pun ADMIN tersisa di sistem — nanti
    // tidak ada yang bisa buka halaman admin lagi sama sekali.
    if (role !== "ADMIN" && staff.role === "ADMIN") {
      const allUsers = await db.all("users");
      const remainingAdmins = allUsers.filter((item) => item.role === "ADMIN" && item.id !== staff.id && item.isActive !== false).length;
      if (remainingAdmins < 1) {
        return NextResponse.json({ error: "Tidak bisa mengubah role ini — sistem harus punya minimal 1 Administrator aktif." }, { status: 400 });
      }
    }
    patch.role = role;
  }

  // "Hapus staff" di UI sebenarnya soft-delete: isActive di-set false, BUKAN
  // dihapus permanen dari database. Jobdesk/report/upload yang sudah pernah
  // dibuat staff ini tetap ada (histori tidak boleh hilang) — staff yang
  // nonaktif cuma tidak bisa login lagi dan hilang dari daftar aktif.
  if (body.isActive !== undefined) {
    const nextActive = Boolean(body.isActive);
    if (!nextActive && staff.id === session.user.id) {
      return NextResponse.json({ error: "Tidak bisa menghapus/menonaktifkan akun sendiri yang sedang dipakai." }, { status: 400 });
    }
    if (!nextActive && staff.role === "ADMIN") {
      const allUsers = await db.all("users");
      const remainingAdmins = allUsers.filter((item) => item.role === "ADMIN" && item.id !== staff.id && item.isActive !== false).length;
      if (remainingAdmins < 1) {
        return NextResponse.json({ error: "Tidak bisa menghapus/menonaktifkan staff ini — sistem harus punya minimal 1 Administrator aktif." }, { status: 400 });
      }
    }
    patch.isActive = nextActive;
  }

  if (body.staffCode !== undefined) {
    const staffCode = typeof body.staffCode === "string" ? body.staffCode.trim() : "";
    if (!staffCode) return NextResponse.json({ error: "ID staff tidak boleh kosong." }, { status: 400 });
    const allUsers = await db.all("users");
    const codeTaken = allUsers.some((item) => item.id !== staff.id && (item.staffCode || "").toLowerCase() === staffCode.toLowerCase());
    if (codeTaken) return NextResponse.json({ error: `ID staff "${staffCode}" sudah dipakai staff lain.` }, { status: 400 });
    patch.staffCode = staffCode;
  }

  // Multi-divisi: `departmentIds` = seluruh divisi yang ditugaskan ke staff
  // ini (mis. Rizki dipegang di Online DAN Kasir), `departmentId` = divisi
  // yang lagi AKTIF/dipakai sekarang (dipakai di seluruh bagian lain sistem
  // — dashboard, filter jobdesk, monitoring, dsb — supaya tidak perlu ubah
  // logic scoping yang sudah ada di tempat lain, cukup satu sumber "divisi
  // aktif" ini yang jadi acuan). Kalau body kirim `departmentIds` (ubah
  // keanggotaan divisi) dan/atau `departmentId` (pindah divisi aktif),
  // divalidasi bareng di sini supaya konsisten satu sama lain.
  if (body.departmentIds !== undefined) {
    const rawIds = Array.isArray(body.departmentIds) ? body.departmentIds : [];
    const ids = [...new Set(rawIds.filter((id) => typeof id === "string" && id))];
    for (const id of ids) {
      const dept = await db.find("departments", (item) => item.id === id);
      if (!dept) return NextResponse.json({ error: "Salah satu divisi yang dipilih tidak ditemukan." }, { status: 400 });
    }
    patch.departmentIds = ids;
    // Kalau divisi aktif dikirim juga di request yang sama, pakai itu
    // (asal ada di daftar keanggotaan baru). Kalau tidak dikirim, divisi
    // aktif yang lama dipertahankan kalau masih ada di daftar baru, atau
    // otomatis pindah ke divisi pertama di daftar (atau kosong kalau
    // keanggotaannya dikosongkan semua).
    const requestedActive = body.departmentId !== undefined ? (body.departmentId || null) : staff.departmentId;
    patch.departmentId = requestedActive && ids.includes(requestedActive) ? requestedActive : (ids[0] || null);
  } else if (body.departmentId !== undefined) {
    // Ganti divisi aktif saja (switch divisi), tanpa ubah keanggotaan.
    // Divisi yang dipilih wajib salah satu dari divisi yang sudah
    // ditugaskan ke staff ini — supaya tidak bisa "pindah" ke divisi yang
    // belum pernah ditambahkan lewat form multi-divisi.
    const nextActive = typeof body.departmentId === "string" && body.departmentId ? body.departmentId : null;
    const membership = Array.isArray(staff.departmentIds) && staff.departmentIds.length
      ? staff.departmentIds
      : (staff.departmentId ? [staff.departmentId] : []);
    if (nextActive && !membership.includes(nextActive)) {
      return NextResponse.json({ error: "Divisi aktif harus salah satu dari divisi yang sudah ditugaskan ke staff ini." }, { status: 400 });
    }
    patch.departmentId = nextActive;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Tidak ada perubahan yang dikirim." }, { status: 400 });
  }

  await db.update("users", (item) => item.id === params.id, patch);

  // Auto-assign jobdesk divisi baru: begitu staff ditambahkan ke divisi yang
  // belum pernah dia ikuti sebelumnya (mis. Rizki yang tadinya cuma di
  // Online, sekarang ditambah ke Kasir juga), staff itu otomatis dapat
  // salinan jobdesk yang sudah ada di divisi Kasir (satu jobdesk per judul
  // unik, diambil dari jobdesk staff lain di divisi itu yang paling baru
  // dibuat) — supaya tidak perlu diinput ulang manual satu-satu. Jobdesk
  // yang judulnya SAMA dengan yang staff ini sudah punya dilewati, jadi
  // tidak dobel kalau form ini disimpan berkali-kali.
  //
  // Sebaliknya, begitu satu divisi DILEPAS dari keanggotaan staff ini,
  // jobdesk lama milik staff ini di divisi tsb otomatis dinonaktifkan
  // (bukan dihapus permanen — histori/progress lama tetap tersimpan, cuma
  // tidak lagi tampil sebagai jobdesk aktif di mana pun). Jadi begitu
  // divisinya di-update, daftar jobdesk staff ini langsung mengikuti
  // divisi yang sedang dipilih saja.
  let autoAssignedJobdeskCount = 0;
  let autoAssignedDepartmentNames = [];
  let removedJobdeskCount = 0;
  let removedDepartmentNames = [];
  if (patch.departmentIds) {
    const previousMembership = departmentMembership(staff);
    const newlyAddedDepartmentIds = patch.departmentIds.filter((id) => !previousMembership.includes(id));
    const removedDepartmentIds = previousMembership.filter((id) => !patch.departmentIds.includes(id));
    const departmentsById = Object.fromEntries((await db.all("departments")).map((item) => [item.id, item]));

    if (removedDepartmentIds.length) {
      const staffJobdesks = await db.filter("jobdesks", (item) => item.userId === staff.id && item.active !== false && removedDepartmentIds.includes(item.departmentId));
      for (const jobdesk of staffJobdesks) {
        await db.update("jobdesks", (item) => item.id === jobdesk.id, { active: false });
        removedJobdeskCount += 1;
      }
      removedDepartmentNames = removedDepartmentIds.map((id) => departmentsById[id]?.name || id);
    }

    if (newlyAddedDepartmentIds.length) {
      const allJobdesks = await db.filter("jobdesks", (item) => item.active !== false);
      const existingTitles = new Set(
        allJobdesks.filter((item) => item.userId === staff.id).map((item) => (item.title || "").trim().toLowerCase())
      );
      const allKpis = await db.all("kpis");

      for (const deptId of newlyAddedDepartmentIds) {
        const deptJobdesks = allJobdesks.filter((item) => item.departmentId === deptId && item.userId !== staff.id);
        // Satu jobdesk representatif per judul unik di divisi ini (yang
        // paling baru dibuat), supaya tidak nyalin jobdesk yang sama
        // berkali-kali dari staff berbeda di divisi yang sama.
        const latestByTitle = new Map();
        for (const jobdesk of deptJobdesks) {
          const key = (jobdesk.title || "").trim().toLowerCase();
          if (!key) continue;
          const existing = latestByTitle.get(key);
          if (!existing || new Date(jobdesk.createdAt || 0) > new Date(existing.createdAt || 0)) latestByTitle.set(key, jobdesk);
        }

        let addedFromThisDept = 0;
        for (const [titleKey, source] of latestByTitle) {
          if (existingTitles.has(titleKey)) continue;
          const newJobdesk = await db.insert("jobdesks", {
            title: source.title,
            description: source.description ?? null,
            priority: source.priority || "MEDIUM",
            active: true,
            departmentId: deptId,
            userId: staff.id,
            targetCount: source.targetCount ?? null,
            sourceRow: source.sourceRow ?? null,
            sourceDivision: source.sourceDivision ?? null,
            sourceTeam: source.sourceTeam ?? null,
            sourcePerson: staff.name,
            sourceJobdeskNo: source.sourceJobdeskNo ?? null,
            sourceText: source.sourceText ?? null,
            sourceRows: source.sourceRows || [],
            kpis: source.kpis || []
          });
          existingTitles.add(titleKey);
          autoAssignedJobdeskCount += 1;
          addedFromThisDept += 1;
          const sourceKpis = allKpis.filter((kpi) => kpi.jobdeskId === source.id);
          for (const kpi of sourceKpis) {
            await db.insert("kpis", { jobdeskId: newJobdesk.id, description: kpi.description, target: kpi.target ?? null });
          }
        }
        if (addedFromThisDept) autoAssignedDepartmentNames.push(departmentsById[deptId]?.name || deptId);
      }
    }
  }

  return NextResponse.json({ ok: true, ...patch, autoAssignedJobdeskCount, autoAssignedDepartmentNames, removedJobdeskCount, removedDepartmentNames });
}
