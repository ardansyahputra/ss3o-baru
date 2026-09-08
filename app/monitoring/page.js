import { requireAdmin } from "@/lib/session";
import { getMonitoringData } from "@/lib/data";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";
import MonitoringView from "@/components/MonitoringView";

export default async function MonitoringPage() {
  const user = await requireAdmin();
  const rows = await getMonitoringData();
  return <AppShell title="Monitoring" user={user}><div className="page-header"><div><p className="eyebrow">Live operations</p><h1 className="page-title">Staff Monitoring</h1><p className="page-subtitle">Monitor progress dan aktivitas staff secara real-time.</p></div><div className="header-actions"><span className="status status-completed">Data tersinkron</span></div></div><MonitoringView rows={rows} /></AppShell>;
}