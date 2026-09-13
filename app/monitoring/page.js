import { requireAdminOrLeader } from "@/lib/session";
import { getMonitoringData } from "@/lib/data";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";
import MonitoringView from "@/components/MonitoringView";

// Store Leader (posisi tertinggi, saat ini "Dika") tetap melihat monitoring
// seluruh toko. LEADER divisi lain (mis. Aldo — Lastcall, Ilham — Reguler,
// Rizki — Online & Kasir) otomatis hanya melihat staff & upload di
// divisi(-divisi) yang jadi tanggung jawabnya — lihat monitoringDepartmentIds
// di lib/roles.js (resolveMonitoringScope) untuk aturan siapa pegang divisi apa.
export default async function MonitoringPage() {
  const user = await requireAdminOrLeader();
  const isStoreLeader = user.position === "Store Leader";
  const scope = isStoreLeader ? null : (user.monitoringDepartmentIds?.length ? user.monitoringDepartmentIds : user.departmentId);
  const rows = await getMonitoringData(scope);
  const scopeLabel = (user.monitoringLabel || user.departmentName || "").trim();
  const pageTitle = isStoreLeader ? "Staff Monitoring" : `Monitoring ${scopeLabel}`.trim();
  const subtitle = isStoreLeader
    ? "Monitor progress dan aktivitas staff secara real-time."
    : `Monitor progress dan aktivitas staff divisi ${scopeLabel} secara real-time.`;
  return <AppShell title="Monitoring" user={user}><div className="page-header"><div><p className="eyebrow">Live operations</p><h1 className="page-title">{pageTitle}</h1><p className="page-subtitle">{subtitle}</p></div><div className="header-actions"><span className="status status-completed">Data tersinkron</span></div></div><MonitoringView rows={rows} /></AppShell>;
}