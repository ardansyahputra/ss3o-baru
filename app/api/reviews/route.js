import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

const uploadTables = ["work_uploads", "lxp_uploads", "dsr_uploads"];

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Hanya Admin yang dapat melakukan review." }, { status: 403 });
  const { targetType, targetId, action, notes } = await request.json();
  if (!targetId || !["APPROVED", "REVISION", "REJECTED"].includes(action)) return NextResponse.json({ error: "Data review tidak valid." }, { status: 400 });
  const patch = { approvalStatus: action, reviewNotes: notes?.trim() || null, reviewedBy: session.user.id, reviewedAt: new Date().toISOString() };
  let updated = 0;
  if (targetType === "report") updated = await db.update("daily_reports", (item) => item.id === targetId, patch);
  if (targetType === "upload") for (const table of uploadTables) updated += await db.update(table, (item) => item.id === targetId, patch);
  if (!updated) return NextResponse.json({ error: "Item tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}