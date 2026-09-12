import { requireUser } from "@/lib/session";
import { getStaffProgressMap, getUserJobdesks, uploadRowsFor } from "@/lib/data";
import db from "@/lib/db";
import AppShell from "@/components/AppShell";
import UploadView from "@/components/UploadView";
import UploadAdminView from "@/components/UploadAdminView";
import AdminNoticePanel from "@/components/AdminNoticePanel";

export default async function UploadsPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    const users = Object.fromEntries((await db.all("users")).map((item) => [item.id, item]));
    const departments = Object.fromEntries((await db.all("departments")).map((item) => [item.id, item.name]));
    const uploads = (await uploadRowsFor()).map((item) => ({ ...item, userName: users[item.userId]?.name || "-", department: departments[users[item.userId]?.departmentId] || "-", position: users[item.userId]?.position || "Staff" }));
    const staffProgress = await getStaffProgressMap();
    const staffList = Object.values(users).filter((item) => item.role !== "ADMIN").map((item) => ({ id: item.id, name: item.name }));
    const notices = (await db.all("admin_notices")).slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).map((item) => ({ ...item, targetName: item.targetUserId ? (users[item.targetUserId]?.name || "-") : "Semua Staff" }));
    return <AppShell title="Upload Dokumen" user={user}><div className="page-header"><div><p className="eyebrow">Proof inspection</p><h1 className="page-title">Kelola Bukti Upload</h1><p className="page-subtitle">Saring dan periksa seluruh bukti kerja yang dikirim staff.</p></div></div><AdminNoticePanel staffList={staffList} initialNotices={notices} /><UploadAdminView uploads={uploads} staffProgress={staffProgress} staffList={staffList} /></AppShell>;
  }
  const notices = (await db.all("admin_notices")).filter((item) => !item.targetUserId || item.targetUserId === user.id).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return <AppShell title="Upload Dokumen" user={user}><div className="page-header"><div><p className="eyebrow">Document center</p><h1 className="page-title">Upload Dokumen</h1><p className="page-subtitle">Simpan bukti pekerjaan dan dokumen operasional pada satu tempat.</p></div></div><UploadView jobdesks={await getUserJobdesks(user)} notices={notices} /></AppShell>;
}