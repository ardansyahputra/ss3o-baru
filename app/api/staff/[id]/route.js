import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { POSITION_OPTIONS } from "@/lib/positions";

const ROLE_OPTIONS = ["ADMIN", "STAFF"];

// Dipakai StaffPositionForm.js & StaffRoleForm.js di halaman Staff Detail
// (admin) untuk ganti posisi/jabatan dan role staff lewat dropdown — bukan
// ketik bebas lagi, supaya penulisannya selalu konsisten (mis. tidak ada
// "Area manager" vs "AREA MANAGER" vs "area mngr" untuk staff berbeda-beda).
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
    // Jangan sampai admin terakhir malah demote diri sendiri/staff lain jadi
    // STAFF sampai tidak ada satu pun ADMIN tersisa di sistem — nanti tidak
    // ada yang bisa buka halaman admin lagi sama sekali.
    if (role === "STAFF" && staff.role === "ADMIN") {
      const allUsers = await db.all("users");
      const remainingAdmins = allUsers.filter((item) => item.role === "ADMIN" && item.id !== staff.id && item.isActive !== false).length;
      if (remainingAdmins < 1) {
        return NextResponse.json({ error: "Tidak bisa mengubah role ini — sistem harus punya minimal 1 Administrator aktif." }, { status: 400 });
      }
    }
    patch.role = role;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Tidak ada perubahan yang dikirim." }, { status: 400 });
  }

  await db.update("users", (item) => item.id === params.id, patch);
  return NextResponse.json({ ok: true, ...patch });
}
