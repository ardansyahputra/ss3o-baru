import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { statusClass, statusLabel } from "@/lib/data";
import db from "@/lib/db";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";
import ReportReviewActions from "@/components/ReportReviewActions";

export default async function ReportDetailPage({ params }) {
  const user = await requireUser();
  const report = await db.find("daily_reports", (item) => item.id === params.id);
  if (!report || (user.role !== "ADMIN" && report.userId !== user.id)) notFound();
  const staff = await db.find("users", (item) => item.id === report.userId);
  const jobdesk = await db.find("jobdesks", (item) => item.id === report.jobdeskId);
  const department = await db.find("departments", (item) => item.id === jobdesk?.departmentId);
  return <AppShell title="Report Detail" user={user}>
    <div className="page-header"><div><p className="eyebrow">Report review</p><h1 className="page-title">Report Hasil Kerja</h1><p className="page-subtitle">Detail report yang tersimpan di sistem.</p></div><a className="button button-ghost" href="/history"><Icon name="arrow" size={14} /> Kembali ke history</a></div>
    <section className="card section-card" style={{ maxWidth: 900 }}><div className="profile-card" style={{ border: 0, boxShadow: "none", padding: 0 }}><span className="avatar large">{staff?.name?.slice(0, 2).toUpperCase()}</span><div><h2>{staff?.name || "Staff"}</h2><p>{department?.name || "-"} · {staff?.position || "Staff"}</p></div><span className={`status ${statusClass(report.status)}`} style={{ marginLeft: "auto" }}>{statusLabel(report.status)}</span></div><div className="detail-grid"><div className="detail-item"><label>Tanggal</label><strong>{report.date || "-"}</strong></div><div className="detail-item"><label>Jobdesk</label><strong>{jobdesk?.title || "-"}</strong></div><div className="detail-item"><label>Progress</label><strong>{report.progress || 0}%</strong></div><div className="detail-item"><label>Updated</label><strong>{report.updatedAt ? new Date(report.updatedAt).toLocaleString("id-ID") : "-"}</strong></div></div><div className="detail-item" style={{ marginTop: 8 }}><label>Report</label><p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>{report.report}</p></div>{report.notes && <div className="detail-item"><label>Catatan</label><p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{report.notes}</p></div>}{user.role === "ADMIN" && <ReportReviewActions initialStatus={report.approvalStatus || "PENDING"} reportId={report.id} />}</section>
  </AppShell>;
}