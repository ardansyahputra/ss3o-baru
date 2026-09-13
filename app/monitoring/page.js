import { requireAdmin } from "@/lib/session";
import { getMonitoringData } from "@/lib/data";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";
import MonitoringView from "@/components/MonitoringView";

// Store Leader (posisi tertinggi, saat ini "Dika") tetap melihat monitoring
// seluruh toko. Admin divisi lain (mis. Aldo — Lastcall, Ilham — Reguler)
// otomatis hanya melihat staff & upload di divisinya sendiri — jadi menu
// Monitoring yang sama jadi "khusus" per divisi tergantung siapa yang login.
export default async function MonitoringPage() {
  const user = await requireAdmin();
  const isStoreLeader = user.position === "Store Leader";
  const rows = await getMonitoringData(isStoreLeader ? null : user.departmentId);
  const pageTitle = isStoreLeader ? "Staff Monitoring" : `Monitoring ${user.departmentName || ""}`.trim();
  const subtitle = isStoreLeader
    ? "Monitor progress dan aktivitas staff secara real-time."
    : `Monitor progress dan aktivitas staff divisi ${user.departmentName || ""} secara real-time.`;
  return <AppShell title="Monitoring" user={user}><div className="page-header"><div><p className="eyebrow">Live operations</p><h1 className="page-title">{pageTitle}</h1><p className="page-subtitle">{subtitle}</p></div><div className="header-actions"><span className="status status-completed">Data tersinkron</span></div></div><MonitoringView rows={rows} /></AppShell>;
}