import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const jobdesk = await db.find("jobdesks", (item) => item.id === body.jobdeskId);
  if (!jobdesk || (session.user.role !== "ADMIN" && jobdesk.userId !== session.user.id)) {
    return NextResponse.json({ error: "Jobdesk tidak dapat diakses." }, { status: 403 });
  }
  const date = body.date || new Date().toISOString().slice(0, 10);
  const completed = Boolean(body.completed);
  const existing = await db.find("daily_progress", (item) => item.userId === session.user.id && item.jobdeskId === jobdesk.id && item.date === date);
  const patch = { completed, progress: completed ? 100 : 0, notes: body.notes?.trim() || null };
  const record = existing
    ? (await db.update("daily_progress", (item) => item.id === existing.id, patch), { ...existing, ...patch })
    : await db.insert("daily_progress", { userId: session.user.id, jobdeskId: jobdesk.id, date, ...patch });
  return NextResponse.json({ ok: true, record });
}