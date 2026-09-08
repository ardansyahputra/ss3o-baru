import { requireUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import ChangeProfileForm from "@/components/ChangeProfileForm";

export default async function SettingsPage() {
  const user = await requireUser();
  return <AppShell title="Settings" user={user}>
    <div className="page-header"><div><p className="eyebrow">Workspace preferences</p><h1 className="page-title">Settings</h1><p className="page-subtitle">Pengaturan tampilan dan akun, tanpa mengubah data backend.</p></div></div>
    <div className="section-grid"><section className="card section-card"><div className="card-heading"><div><h2>Profile</h2><p>Informasi dasar akun kamu.</p></div><Icon name="user" size={17} /></div><div className="detail-item"><label>Role access</label><strong>{user.role === "ADMIN" ? "Administrator access" : "Staff access"}</strong></div><ChangeProfileForm user={user} /></section><section className="card section-card"><div className="card-heading"><div><h2>Appearance</h2><p>Preferensi tampilan aplikasi.</p></div><Icon name="settings" size={17} /></div><div className="detail-item"><label>Theme</label><strong>Light · Corporate</strong></div><div className="detail-item"><label>Language</label><strong>Bahasa Indonesia</strong></div></section></div>
    <section className="card section-card security-section" style={{ marginTop: 18 }}><div className="card-heading"><div><h2>Security</h2><p>Kelola password akun kamu secara mandiri.</p></div><Icon name="shield" size={17} /></div><div className="detail-item"><label>Session</label><strong>JWT · 8 jam · aktif</strong></div><ChangePasswordForm /></section>
  </AppShell>;
}