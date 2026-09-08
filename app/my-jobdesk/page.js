import { requireUser } from "@/lib/session";
import { getUserJobdesks } from "@/lib/data";
import AppShell from "@/components/AppShell";
import MyJobdeskView from "@/components/MyJobdeskView";

export default async function MyJobdeskPage({ searchParams }) {
  const user = await requireUser();
  const jobdesks = await getUserJobdesks(user);
  return <AppShell title="Jobdesk Saya" user={user}>
    <div className="page-header"><div><p className="eyebrow">Workspace</p><h1 className="page-title">Jobdesk Saya</h1><p className="page-subtitle">Kelola dan pantau seluruh tanggung jawab yang ditugaskan kepada kamu.</p></div></div>
    <MyJobdeskView initialSearch={searchParams?.search || ""} jobdesks={jobdesks} />
  </AppShell>;
}