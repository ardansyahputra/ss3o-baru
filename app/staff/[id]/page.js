import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getStaffJobdesks, statusClass, statusLabel } from "@/lib/data";
import db from "@/lib/db";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";

function roleLabel(role) {
  return role === "ADMIN" ? "Administrator" : "Staff";
}

export default async function StaffDetailPage({ params }) {
  const user = await requireAdmin();
  const staff = await db.find("users", (item) => item.id === params.id);
  if (!staff) notFound();
  const department = await db.find("departments", (item) => item.id === staff.departmentId);
  const jobdesks = await getStaffJobdesks(staff.id);
  const reports = await db.filter("daily_reports", (item) => item.userId === staff.id);
  const isActive = staff.isActive !== false;
  const average = jobdesks.length ? Math.round(jobdesks.reduce((sum, item) => sum + item.progress, 0) / jobdesks.length) : 0;

  return <AppShell title="Staff Detail" user={user}>
    <div className="page-header">
      <div><p className="eyebrow">Staff management</p><h1 className="page-title">{staff.name}</h1><p className="page-subtitle">Rincian penugasan, progress, dan aktivitas report staff ini.</p></div>
      <a className="button button-ghost" href="/staff"><Icon name="arrow" size={14} /> Kembali</a>
    </div>

    <section className="card profile-card">
      <span className="avatar large">{staff.name.slice(0, 2).toUpperCase()}</span>
      <div><h2>{staff.name}</h2><p>{staff.position || roleLabel(staff.role)} · {department?.name || "Tanpa divisi"} · {staff.email}</p></div>
      <span className={`status ${isActive ? "status-completed" : "status-not-started"}`} style={{ marginLeft: "auto" }}>{isActive ? "Active" : "Inactive"}</span>
    </section>

    <div className="stat-grid" style={{ marginTop: 18 }}>
      <div className="card stat-card"><div className="stat-card-top"><span>Total Jobdesk</span><span className="stat-icon"><Icon name="briefcase" size={15} /></span></div><div className="stat-value">{jobdesks.length}</div><div className="stat-foot">Penugasan aktif</div></div>
      <div className="card stat-card"><div className="stat-card-top"><span>Reports</span><span className="stat-icon"><Icon name="report" size={15} /></span></div><div className="stat-value">{reports.length}</div><div className="stat-foot">Total report tersubmit</div></div>
      <div className="card stat-card"><div className="stat-card-top"><span>Rata-rata Progress</span><span className="stat-icon"><Icon name="chart" size={15} /></span></div><div className="stat-value">{average}%</div><div className="stat-foot">Dari seluruh jobdesk</div></div>
      <div className="card stat-card"><div className="stat-card-top"><span>Role</span><span className="stat-icon"><Icon name="shield" size={15} /></span></div><div className="stat-value" style={{ fontSize: 18 }}>{roleLabel(staff.role)}</div><div className="stat-foot">{staff.position || "Belum ada posisi"}</div></div>
    </div>

    <section className="card section-card" style={{ marginTop: 18 }}>
      <div className="card-heading"><div><h2>Rincian Jobdesk</h2><p>Cakupan kerja, target, dan progress terkini untuk setiap penugasan.</p></div></div>
      {jobdesks.length
        ? <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Jobdesk</th><th>Priority</th><th>Progress</th><th>Status</th></tr></thead>
              <tbody>
                {jobdesks.map((jobdesk) => <tr key={jobdesk.id}>
                  <td>
                    <div className="table-title">{jobdesk.title}</div>
                    <div className="table-muted">{jobdesk.description || "Belum ada detail cakupan kerja."}</div>
                  </td>
                  <td><span className={`priority priority-${jobdesk.priority}`}>{jobdesk.priority}</span></td>
                  <td>
                    <div className="mini-progress">
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${jobdesk.progress}%` }} /></div>
                      <span>{jobdesk.targetCount ? `${jobdesk.approvedCount}/${jobdesk.targetCount} · ${jobdesk.progress}%` : `${jobdesk.progress}%`}</span>
                    </div>
                  </td>
                  <td><span className={`status ${statusClass(jobdesk.status)}`}>{statusLabel(jobdesk.status)}</span></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        : <div className="empty-state"><Icon name="briefcase" size={27} /><strong>Belum ada jobdesk</strong><p>Tambahkan jobdesk baru untuk staff ini dari menu Jobdesk & KPI.</p></div>}
    </section>
  </AppShell>;
}
