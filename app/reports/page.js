import { requireUser } from "@/lib/session";
import { getUserJobdesks } from "@/lib/data";
import AppShell from "@/components/AppShell";
import ReportForm from "@/components/ReportForm";
import Icon from "@/components/Icons";

export default async function ReportsPage({ searchParams }) {
  const user = await requireUser();
  const jobdesks = await getUserJobdesks(user);
  return <AppShell title="Report Kerja" user={user}>
    <div className="page-header"><div><p className="eyebrow">Daily reporting</p><h1 className="page-title">Report Hasil Kerja</h1><p className="page-subtitle">Catat progress pekerjaan dengan ringkas dan terukur.</p></div><div className="header-actions"><a className="button button-ghost" href="/history"><Icon name="history" size={15} /> Lihat history</a></div></div>
    {jobdesks.length ? <ReportForm initialJobdeskId={searchParams?.jobdesk} jobdesks={jobdesks} /> : <div className="card empty-state"><Icon name="report" size={28} /><strong>Belum ada jobdesk untuk dilaporkan</strong><p>Hubungi admin jika kamu belum menerima penugasan.</p></div>}
  </AppShell>;
}