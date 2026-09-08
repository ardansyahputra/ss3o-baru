import { requireAdmin } from "@/lib/session";
import db from "@/lib/db";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";
import JobdeskForm from "@/components/JobdeskForm";

export default async function NewJobdeskPage() {
  const user = await requireAdmin();
  const departments = await db.all("departments");
  const users = (await db.all("users")).filter((item) => item.isActive !== false);
  return <AppShell title="Tambah Jobdesk" user={user}>
    <div className="page-header">
      <div><p className="eyebrow">Administration</p><h1 className="page-title">Tambah jobdesk baru</h1><p className="page-subtitle">Tetapkan jobdesk baru untuk staff/admin di divisi manapun (Kasir, Stockroom, Admin, dll), lengkap dengan detail cakupan kerjanya.</p></div>
      <a className="button button-ghost" href="/jobdesk"><Icon name="arrow" size={14} /> Kembali</a>
    </div>
    <JobdeskForm departments={departments} users={users} />
  </AppShell>;
}
