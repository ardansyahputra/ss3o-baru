import { requireAdmin } from "@/lib/session";
import { getDashboardData } from "@/lib/data";
import db from "@/lib/db";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";
import JobdeskTable from "@/components/JobdeskTable";

export default async function JobdeskAdminPage({ searchParams }) {
  const user = await requireAdmin();
  const data = await getDashboardData(user);
  const kpis = await db.all("kpis");
  return <AppShell title="Jobdesk & KPI" user={user}>
    <div className="page-header"><div><p className="eyebrow">Administration</p><h1 className="page-title">Jobdesk & KPI</h1><p className="page-subtitle">Atur penugasan, prioritas, dan indikator performa staff.</p></div><a className="button button-primary" href="/jobdesk/new"><Icon name="plus" size={14} /> Tambah Jobdesk</a></div>
    <JobdeskTable allJobdesks={data.allJobdesks} departments={data.departments} initialSearch={searchParams?.search || ""} kpis={kpis} />
  </AppShell>;
}