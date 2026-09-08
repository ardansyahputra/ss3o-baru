import { requireUser } from "@/lib/session";
import { uploadRowsFor } from "@/lib/data";
import db from "@/lib/db";
import AppShell from "@/components/AppShell";
import HistoryTabs from "@/components/HistoryTabs";

export default async function HistoryPage() {
  const user = await requireUser();
  const users = await db.all("users");
  const jobdesks = await db.all("jobdesks");
  const reports = (await db.all("daily_reports")).filter((item) => user.role === "ADMIN" || item.userId === user.id).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  const uploads = (await uploadRowsFor(user.role === "ADMIN" ? undefined : user.id)).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  return <AppShell title="History" user={user}>
    <div className="page-header"><div><p className="eyebrow">Activity archive</p><h1 className="page-title">History</h1><p className="page-subtitle">Riwayat report dan aktivitas yang tercatat di sistem.</p></div></div>
    <HistoryTabs reports={reports} uploads={uploads} users={users} jobdesks={jobdesks} />
  </AppShell>;
}