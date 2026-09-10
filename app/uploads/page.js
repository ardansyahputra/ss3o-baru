import { requireUser } from "@/lib/session";
import { getStaffProgressMap, getUserJobdesks, uploadRowsFor } from "@/lib/data";
import db from "@/lib/db";
import AppShell from "@/components/AppShell";
import UploadView from "@/components/UploadView";
import UploadAdminView from "@/components/UploadAdminView";

export default async function UploadsPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    const users = Object.fromEntries((await db.all("users")).map((item) => [item.id, item]));
    const departments = Object.fromEntries((await db.all("departments")).map((item) => [item.id, item.name]));
    const uploads = (await uploadRowsFor()).map((item) => ({ ...item, userName: users[item.userId]?.name || "-", department: departments[users[item.userId]?.departmentId] || "-", position: users[item.userId]?.position || "Staff" }));
    const staffProgress = await getStaffProgressMap();
    return <AppShell title="Upload Dokumen" user={user}><div className="page-header"><div><p className="eyebrow">Proof inspection</p><h1 className="page-title">Kelola Bukti Upload</h1><p className="page-subtitle">Saring dan periksa seluruh bukti kerja yang dikirim staff.</p></div></div><UploadAdminView uploads={uploads} staffProgress={staffProgress} /></AppShell>;
  }
  return <AppShell title="Upload Dokumen" user={user}><div className="page-header"><div><p className="eyebrow">Document center</p><h1 className="page-title">Upload Dokumen</h1><p className="page-subtitle">Simpan bukti pekerjaan dan dokumen operasional pada satu tempat.</p></div></div><UploadView jobdesks={await getUserJobdesks(user)} /></AppShell>;
}