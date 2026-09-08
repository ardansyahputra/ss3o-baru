import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

const UPLOAD_TABLES = [
  { table: "work_uploads", label: "Hasil Kerja" },
  { table: "lxp_uploads", label: "LXP" },
  { table: "dsr_uploads", label: "DSR Staff" },
];

const REVIEW_LABEL = { APPROVED: "Disetujui", REVISION: "Perlu Revisi", REJECTED: "Ditolak" };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [jobdesks, reports] = await Promise.all([db.all("jobdesks"), db.all("daily_reports")]);
  const jobdeskMap = Object.fromEntries(jobdesks.map((item) => [item.id, item]));
  const items = [];

  if (session.user.role === "ADMIN") {
    // Menu notifikasi Admin (Dika) — otomatis menampung aktivitas SEMUA
    // staff, siapapun yang mengirim, tanpa perlu filter apa-apa.
    const users = await db.all("users");
    const userMap = Object.fromEntries(users.map((item) => [item.id, item]));

    for (const report of reports) {
      const staff = userMap[report.userId];
      items.push({
        id: `report-${report.id}`,
        kind: "incoming",
        type: "report",
        typeLabel: "Report Harian",
        staffName: staff?.name || "Staff",
        jobdeskTitle: jobdeskMap[report.jobdeskId]?.title || "Jobdesk",
        time: report.createdAt,
        imageUrl: null,
        href: `/reports/${report.id}`,
      });
    }

    for (const { table, label } of UPLOAD_TABLES) {
      const rows = await db.all(table);
      for (const row of rows) {
        const staff = userMap[row.userId];
        items.push({
          id: `${table}-${row.id}`,
          kind: "incoming",
          type: table,
          typeLabel: label,
          staffName: staff?.name || "Staff",
          jobdeskTitle: row.jobdeskId ? jobdeskMap[row.jobdeskId]?.title || "Jobdesk" : null,
          time: row.createdAt,
          imageUrl: row.mimeType?.startsWith("image/") ? row.filePath : null,
          fileName: row.fileName,
          href: "/uploads",
        });
      }
    }
  } else {
    // Menu notifikasi Staff — hasil review (approve/revisi/reject) beserta
    // catatan dari Dika, khusus untuk report/upload milik staff itu sendiri.
    const myReports = reports.filter((item) => item.userId === session.user.id && item.approvalStatus);
    for (const report of myReports) {
      items.push({
        id: `report-${report.id}`,
        kind: "review",
        type: "report",
        typeLabel: "Report Harian",
        jobdeskTitle: jobdeskMap[report.jobdeskId]?.title || "Jobdesk",
        reviewStatus: report.approvalStatus,
        reviewStatusLabel: REVIEW_LABEL[report.approvalStatus] || report.approvalStatus,
        reviewNotes: report.reviewNotes || null,
        time: report.reviewedAt || report.updatedAt,
        imageUrl: null,
        href: `/reports/${report.id}`,
      });
    }

    for (const { table, label } of UPLOAD_TABLES) {
      const rows = (await db.all(table)).filter((item) => item.userId === session.user.id && item.approvalStatus);
      for (const row of rows) {
        items.push({
          id: `${table}-${row.id}`,
          kind: "review",
          type: table,
          typeLabel: label,
          jobdeskTitle: row.jobdeskId ? jobdeskMap[row.jobdeskId]?.title || "Jobdesk" : null,
          reviewStatus: row.approvalStatus,
          reviewStatusLabel: REVIEW_LABEL[row.approvalStatus] || row.approvalStatus,
          reviewNotes: row.reviewNotes || null,
          time: row.reviewedAt || row.updatedAt,
          imageUrl: row.mimeType?.startsWith("image/") ? row.filePath : null,
          fileName: row.fileName,
          href: "/history",
        });
      }
    }
  }

  items.sort((a, b) => new Date(b.time) - new Date(a.time));

  return NextResponse.json({ notifications: items.slice(0, 30) });
}
