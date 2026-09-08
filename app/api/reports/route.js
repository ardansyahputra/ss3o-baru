import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.jobdeskId || !body.report) return NextResponse.json({ error: "Jobdesk dan report wajib diisi." }, { status: 400 });
  const jobdesk = await db.find("jobdesks", (item) => item.id === body.jobdeskId);
  if (!jobdesk || (session.user.role !== "ADMIN" && jobdesk.userId !== session.user.id)) return NextResponse.json({ error: "Jobdesk tidak dapat diakses." }, { status: 403 });
  const progress = Math.max(0, Math.min(100, Number(body.progress) || 0));
  const record = await db.insert("daily_reports", {
    date: body.date || new Date().toISOString().slice(0, 10),
    userId: session.user.id,
    jobdeskId: body.jobdeskId,
    report: body.report.trim(),
    progress,
    status: body.status || "ON_PROGRESS",
    notes: body.notes?.trim() || null,
  });
  return NextResponse.json({ ok: true, record });
}