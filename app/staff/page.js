import { requireAdmin } from "@/lib/session";
import db from "@/lib/db";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";
import StaffTable from "@/components/StaffTable";

export default async function StaffPage() {
  const user = await requireAdmin();
  const users = await db.all("users");
  const departments = await db.all("departments");
  return <AppShell title="Staff" user={user}>
    <div className="page-header"><div><p className="eyebrow">Administration</p><h1 className="page-title">Staff</h1><p className="page-subtitle">Kelola akses, posisi, dan penempatan staff SS3O.</p></div><span className="status status-progress"><Icon name="info" size={14} /> Data source existing</span></div>
    <div className="stat-grid"><div className="card stat-card"><div className="stat-card-top"><span>Total Staff</span><span className="stat-icon"><Icon name="users" size={15} /></span></div><div className="stat-value">{users.length}</div><div className="stat-foot">Semua akun</div></div><div className="card stat-card"><div className="stat-card-top"><span>Active</span><span className="stat-icon"><Icon name="check" size={15} /></span></div><div className="stat-value">{users.filter((item) => item.isActive !== false).length}</div><div className="stat-foot positive">Akun aktif</div></div><div className="card stat-card"><div className="stat-card-top"><span>Inactive</span><span className="stat-icon"><Icon name="info" size={15} /></span></div><div className="stat-value">{users.filter((item) => item.isActive === false).length}</div><div className="stat-foot">Akun nonaktif</div></div><div className="card stat-card"><div className="stat-card-top"><span>Departments</span><span className="stat-icon"><Icon name="building" size={15} /></span></div><div className="stat-value">{departments.length}</div><div className="stat-foot">Divisi terdaftar</div></div></div>
    <StaffTable departments={departments} users={users} />
  </AppShell>;
}