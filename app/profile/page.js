import { requireUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";
import Link from "next/link";

function initials(name = "") { return name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase(); }

export default async function ProfilePage() {
  const user = await requireUser();
  return <AppShell title="Profile" user={user}>
    <div className="page-header"><div><p className="eyebrow">Account</p><h1 className="page-title">Profile</h1><p className="page-subtitle">Informasi akun dan role kamu di SS3O.</p></div><Link className="button button-secondary" href="/settings"><Icon name="settings" size={15} /> Buka Settings</Link></div>
    <section className="card profile-card"><span className="avatar large">{initials(user.name)}</span><div><h2>{user.name}</h2><p>{user.position || (user.role === "ADMIN" ? "Administrator" : "Staff")} · {user.departmentName || "Belum ada divisi"}</p></div><span className="status status-completed" style={{ marginLeft: "auto" }}>Active</span></section>
    <section className="card section-card" style={{ marginTop: 18 }}><div className="card-heading"><div><h2>Account details</h2><p>Data ini bersumber dari akun existing.</p></div></div><div className="detail-grid"><div className="detail-item"><label>Nama lengkap</label><strong>{user.name}</strong></div><div className="detail-item"><label>Email</label><strong>{user.email}</strong></div><div className="detail-item"><label>Position</label><strong>{user.position || "-"}</strong></div><div className="detail-item"><label>Department</label><strong>{user.departmentName || "-"}</strong></div><div className="detail-item"><label>Role</label><strong>{user.role}</strong></div><div className="detail-item"><label>Account status</label><strong style={{ color: "var(--green)" }}>Active</strong></div></div></section>
  </AppShell>;
}