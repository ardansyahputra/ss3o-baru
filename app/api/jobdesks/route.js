import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

const PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"];

function parseTargetCount(value) {
  if (value === null || value === undefined || value === "") return { targetCount: null };
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return { error: "Target harus berupa angka lebih dari 0." };
  return { targetCount: Math.round(parsed) };
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Hanya Admin yang dapat menambah jobdesk." }, { status: 403 });
  const body = await request.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "Judul jobdesk wajib diisi." }, { status: 400 });
  if (!body.userId) return NextResponse.json({ error: "Staff yang mengerjakan wajib dipilih." }, { status: 400 });
  const staff = await db.find("users", (item) => item.id === body.userId);
  if (!staff) return NextResponse.json({ error: "Staff tidak ditemukan." }, { status: 404 });

  const target = parseTargetCount(body.targetCount);
  if (target.error) return NextResponse.json({ error: target.error }, { status: 400 });

  const priority = PRIORITIES.includes(body.priority) ? body.priority : "MEDIUM";
  const record = await db.insert("jobdesks", {
    title: body.title.trim(),
    description: body.description?.trim() || null,
    priority,
    active: true,
    departmentId: body.departmentId || staff.departmentId || null,
    userId: staff.id,
    targetCount: target.targetCount,
    sourceRow: null,
    sourceDivision: null,
    sourceTeam: null,
    sourcePerson: staff.name,
    sourceJobdeskNo: null,
    sourceText: null,
    sourceRows: [],
    kpis: [],
  });
  return NextResponse.json({ ok: true, record });
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Hanya Admin yang dapat mengubah jobdesk." }, { status: 403 });
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "Jobdesk wajib diisi." }, { status: 400 });
  const jobdesk = await db.find("jobdesks", (item) => item.id === body.id);
  if (!jobdesk) return NextResponse.json({ error: "Jobdesk tidak ditemukan." }, { status: 404 });

  const patch = {};

  if ("targetCount" in body) {
    const target = parseTargetCount(body.targetCount);
    if (target.error) return NextResponse.json({ error: target.error }, { status: 400 });
    patch.targetCount = target.targetCount;
  }
  if ("title" in body) {
    if (!body.title?.trim()) return NextResponse.json({ error: "Judul jobdesk tidak boleh kosong." }, { status: 400 });
    patch.title = body.title.trim();
  }
  if ("description" in body) {
    patch.description = body.description?.trim() || null;
  }
  if ("priority" in body && PRIORITIES.includes(body.priority)) {
    patch.priority = body.priority;
  }

  await db.update("jobdesks", (item) => item.id === body.id, patch);
  return NextResponse.json({ ok: true, ...patch });
}
