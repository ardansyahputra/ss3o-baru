import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { statusClass, statusLabel } from "@/lib/data";
import db from "@/lib/db";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";
import JobdeskDetailForm from "@/components/JobdeskDetailForm";

export default async function JobdeskDetailPage({ params }) {
  const user = await requireAdmin();
  const jobdesk = await db.find("jobdesks", (item) => item.id === params.id);
  if (!jobdesk) notFound();
  const staff = await db.find("users", (item) => item.id === jobdesk.userId);
  const department = await db.find("departments", (item) => item.id === jobdesk.departmentId);
  const kpis = await db.filter("kpis", (item) => item.jobdeskId === jobdesk.id);
  const report = (await db.filter("daily_reports", (item) => item.jobdeskId === jobdesk.id)).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0];
  const targetCount = Number(jobdesk.targetCount) > 0 ? Math.round(Number(jobdesk.targetCount)) : null;
  const approvedCount = targetCount ? (await db.filter("daily_reports", (item) => item.jobdeskId === jobdesk.id && item.userId === jobdesk.userId && item.approvalStatus === "APPROVED")).length : 0;
  return <AppShell title="Jobdesk Detail" user={user}><div className="page-header"><div><p className="eyebrow">Jobdesk & KPI</p><h1 className="page-title">Jobdesk detail</h1><p className="page-subtitle">Penugasan, KPI, dan report terbaru.</p></div><a className="button button-ghost" href="/jobdesk"><Icon name="arrow" size={14} /> Kembali</a></div><section className="card section-card" style={{ maxWidth: 900 }}><span className={`priority priority-${jobdesk.priority}`}>{jobdesk.priority}</span><h2 style={{ fontSize: 20, letterSpacing: "-.035em", margin: "15px 0 7px" }}>{jobdesk.title}</h2><p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.65, margin: 0 }}>{jobdesk.description || "Tidak ada deskripsi tambahan."}</p><div className="detail-grid"><div className="detail-item"><label>Staff</label><strong>{staff?.name || "-"}</strong></div><div className="detail-item"><label>Department</label><strong>{department?.name || "-"}</strong></div><div className="detail-item"><label>Status terbaru</label><strong>{report ? <span className={`status ${statusClass(report.status)}`}>{statusLabel(report.status)}</span> : "Not Started"}</strong></div><div className="detail-item"><label>Progress</label><strong>{targetCount ? `${approvedCount}/${targetCount} (${Math.min(100, Math.round((approvedCount / targetCount) * 100))}%)` : `${report?.progress || 0}%`}</strong></div></div><div className="detail-item"><label>KPI</label>{kpis.length ? kpis.map((kpi) => <p key={kpi.id} style={{ fontSize: 12, margin: "0 0 7px" }}>• {kpi.description}{kpi.target ? ` · Target ${kpi.target}` : ""}</p>) : <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>Belum ada KPI untuk jobdesk ini.</p>}</div><div className="detail-item" style={{ borderTop: "1px solid var(--border, #eee)", marginTop: 14, paddingTop: 14 }}><label>Edit detail & target jobdesk</label><JobdeskDetailForm jobdeskId={jobdesk.id} currentDescription={jobdesk.description || ""} currentTarget={jobdesk.targetCount || ""} /></div></section></AppShell>;
}