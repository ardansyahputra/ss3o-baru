import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { roleLabel } from "@/lib/roles";
import { getStaffJobdesks, statusClass, statusLabel } from "@/lib/data";
import { POSITION_OPTIONS } from "@/lib/positions";
import db from "@/lib/db";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";
import StaffPositionForm from "@/components/StaffPositionForm";
import StaffRoleForm from "@/components/StaffRoleForm";
import StaffIdForm from "@/components/StaffIdForm";
import StaffDepartmentForm from "@/components/StaffDepartmentForm";

export default async function StaffDetailPage({ params }) {
  const user = await requireAdmin();
  const staff = await db.find("users", (item) => item.id === params.id);
  if (!staff) notFound();
  const departments = await db.all("departments");
  const department = departments.find((item) => item.id === staff.departmentId) || null;
  // Staff lama (dibuat sebelum fitur multi-divisi) belum punya field
  // `departmentIds` sama sekali — dianggap cuma anggota divisi aktifnya
  // sendiri (kalau ada) supaya form multi-divisi tetap tampil benar.
  const departmentIds = Array.isArray(staff.departmentIds) && staff.departmentIds.length
    ? staff.departmentIds
    : (staff.departmentId ? [staff.departmentId] : []);
  const jobdesks = await getStaffJobdesks(staff.id);
  const reports = await db.filter("daily_reports", (item) => item.userId === staff.id);
  const isActive = staff.isActive !== false;
  const totalUploads = jobdesks.reduce((sum, item) => sum + (item.uploadCount || 0), 0);

  return <AppShell title="Staff Detail" user={user}>
    <div className="page-header">
      <div><p className="eyebrow">Staff management</p><h1 className="page-title">{staff.name}</h1><p className="page-subtitle">Rincian penugasan, progress, dan aktivitas report staff ini.</p></div>
      <a className="button button-ghost" href="/staff"><Icon name="arrow" size={14} /> Kembali</a>
    </div>

    <section className="card profile-card">
      <span className="avatar large">{staff.name.slice(0, 2).toUpperCase()}</span>
      <div><h2>{staff.name}</h2><p>{staff.position || roleLabel(staff.role)} · {department?.name || "Tanpa divisi"} · {staff.email}{staff.staffCode ? ` · ID: ${staff.staffCode}` : ""}</p></div>
      <span className={`status ${isActive ? "status-completed" : "status-not-started"}`} style={{ marginLeft: "auto" }}>{isActive ? "Active" : "Inactive"}</span>
    </section>

    <section className="card section-card" style={{ marginTop: 18 }}>
      <div className="card-heading"><div><h2>Ubah Posisi, Role & ID Staff</h2><p>Pilih posisi/jabatan, role akses, dan ID staff internal dari sini.</p></div><Icon name="user" size={17} /></div>
      <StaffPositionForm currentPosition={staff.position || "Staff"} options={POSITION_OPTIONS} staffId={staff.id} />
      <StaffRoleForm currentRole={staff.role} staffId={staff.id} />
      <StaffIdForm currentStaffCode={staff.staffCode || ""} staffId={staff.id} />
    </section>

    <section className="card section-card" style={{ marginTop: 18 }}>
      <div className="card-heading"><div><h2>Divisi Staff</h2><p>Tugaskan staff ini ke lebih dari satu divisi, lalu tentukan divisi mana yang sedang aktif.</p></div><Icon name="building" size={17} /></div>
      <StaffDepartmentForm currentDepartmentId={staff.departmentId || ""} currentDepartmentIds={departmentIds} departments={departments} staffId={staff.id} />
    </section>

    <div className="stat-grid" style={{ marginTop: 18 }}>
      <div className="card stat-card"><div className="stat-card-top"><span>Total Jobdesk</span><span className="stat-icon"><Icon name="briefcase" size={15} /></span></div><div className="stat-value">{jobdesks.length}</div><div className="stat-foot">Penugasan aktif</div></div>
      <div className="card stat-card"><div className="stat-card-top"><span>Reports</span><span className="stat-icon"><Icon name="report" size={15} /></span></div><div className="stat-value">{reports.length}</div><div className="stat-foot">Total report tersubmit</div></div>
      <div className="card stat-card"><div className="stat-card-top"><span>Total Upload</span><span className="stat-icon"><Icon name="chart" size={15} /></span></div><div className="stat-value">{totalUploads}</div><div className="stat-foot">Dari seluruh jobdesk</div></div>
      <div className="card stat-card"><div className="stat-card-top"><span>Role</span><span className="stat-icon"><Icon name="shield" size={15} /></span></div><div className="stat-value" style={{ fontSize: 18 }}>{roleLabel(staff.role)}</div><div className="stat-foot">{staff.position || "Belum ada posisi"}</div></div>
    </div>

    <section className="card section-card" style={{ marginTop: 18 }}>
      <div className="card-heading"><div><h2>Rincian Jobdesk</h2><p>Cakupan kerja, target, dan progress terkini untuk setiap penugasan.</p></div></div>
      {jobdesks.length
        ? <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Jobdesk</th><th>Priority</th><th>Upload</th><th>Status</th></tr></thead>
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
                      <span>{jobdesk.targetCount ? `${jobdesk.approvedCount}/${jobdesk.targetCount}` : `${jobdesk.uploadCount || 0} upload`}</span>
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
