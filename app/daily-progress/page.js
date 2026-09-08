import { requireUser } from "@/lib/session";
import { getUserJobdesks } from "@/lib/data";
import AppShell from "@/components/AppShell";
import ProgressChecklist from "@/components/ProgressChecklist";
import Icon from "@/components/Icons";

export default async function DailyProgressPage() {
  const user = await requireUser();
  const jobdesks = await getUserJobdesks(user);
  const done = jobdesks.filter((item) => item.status === "COMPLETED" || item.progress === 100).length;
  return <AppShell title="Progress Harian" user={user}>
    <div className="page-header"><div><p className="eyebrow">Daily overview</p><h1 className="page-title">Progress Harian</h1><p className="page-subtitle">Lihat alur pekerjaan dan capaian kamu hari ini.</p></div><div aria-label="Tanggal progress" className="button button-ghost" role="status"><Icon name="calendar" size={15} /> {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div></div>
    <div className="stat-grid"><div className="card stat-card"><div className="stat-card-top"><span>Staff</span><span className="stat-icon"><Icon name="user" size={15} /></span></div><div className="stat-value" style={{ fontSize: 20 }}>{user.name}</div><div className="stat-foot">{user.departmentName || "SS3O"}</div></div><div className="card stat-card"><div className="stat-card-top"><span>Jobdesk</span><span className="stat-icon"><Icon name="briefcase" size={15} /></span></div><div className="stat-value">{jobdesks.length}</div><div className="stat-foot">Jobdesk hari ini</div></div><div className="card stat-card"><div className="stat-card-top"><span>Completed</span><span className="stat-icon"><Icon name="check" size={15} /></span></div><div className="stat-value">{done}</div><div className="stat-foot">Sudah selesai</div></div><div className="card stat-card"><div className="stat-card-top"><span>Overall</span><span className="stat-icon"><Icon name="chart" size={15} /></span></div><div className="stat-value">{jobdesks.length ? Math.round(jobdesks.reduce((sum, item) => sum + item.progress, 0) / jobdesks.length) : 0}%</div><div className="stat-foot">Progress rata-rata</div></div></div>
    <ProgressChecklist jobdesks={jobdesks} />
  </AppShell>;
}