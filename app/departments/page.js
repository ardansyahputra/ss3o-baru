import { requireAdmin } from "@/lib/session";
import { getDashboardData } from "@/lib/data";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";

export default async function DepartmentsPage() {
  const user = await requireAdmin();
  const data = await getDashboardData(user);
  return <AppShell title="Divisi" user={user}>
    <div className="page-header"><div><p className="eyebrow">Administration</p><h1 className="page-title">Department</h1><p className="page-subtitle">Struktur divisi dan distribusi pekerjaan di SS3O.</p></div><span className="status status-progress"><Icon name="info" size={14} /> Data source existing</span></div>
    {data.departments.length ? <div className="department-grid">{data.departments.map((department) => { const staff = data.users.filter((item) => item.departmentId === department.id); const jobs = data.allJobdesks.filter((item) => item.departmentId === department.id); const progress = jobs.length ? Math.round(jobs.reduce((sum, item) => sum + item.progress, 0) / jobs.length) : 0; return <article className="card department-card" key={department.id}><div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}><span className="stat-icon"><Icon name="building" size={16} /></span><span className="status status-progress">{staff.length} staff</span></div><h3>{department.name}</h3><div className="card-meta"><span>{jobs.length} jobdesk aktif</span><strong>{progress}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div><div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}><a className="text-link" href={`/departments/${department.id}`}>View department <Icon name="arrow" size={13} /></a></div></article>; })}</div> : <div className="card empty-state"><Icon name="building" size={28} /><strong>Belum ada department</strong><p>Tambahkan department untuk mulai mengelompokkan staff.</p></div>}
  </AppShell>;
}