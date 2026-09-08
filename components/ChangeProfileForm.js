"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";

export default function ChangeProfileForm({ user }) {
  const { update } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "" });
  const [state, setState] = useState({ status: "idle", message: "" });

  function update_(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (state.status !== "idle") setState({ status: "idle", message: "" });
  }

  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch("/api/auth/change-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState({ status: "error", message: result.error || "Profil belum dapat diubah." });
        return;
      }
      // Refresh JWT session (nama/email di sidebar & topbar) tanpa perlu logout,
      // lalu refresh data server component halaman ini supaya langsung sinkron.
      await update({ name: result.name, email: result.email });
      router.refresh();
      setState({ status: "success", message: result.message || "Profil berhasil diubah." });
    } catch {
      setState({ status: "error", message: "Tidak dapat terhubung ke server. Coba lagi." });
    }
  }

  return <form aria-label="Form ubah username dan email" className="password-form" onSubmit={submit}>
    <div className="password-form-intro"><span className="security-badge"><Icon name="user" size={16} /></span><div><strong>Identitas akun</strong><p>Username dan email dipakai untuk login dan tampil di seluruh workspace.</p></div></div>
    <div className="password-fields">
      <label className="form-group password-field" htmlFor="profile-name"><span className="form-label">Username</span><input className="form-control" id="profile-name" minLength={2} placeholder="Nama tampilan" required type="text" value={form.name} onChange={(event) => update_("name", event.target.value)} /></label>
      <label className="form-group password-field" htmlFor="profile-email"><span className="form-label">Email</span><input autoComplete="email" className="form-control" id="profile-email" placeholder="nama@ss3o.com" required type="email" value={form.email} onChange={(event) => update_("email", event.target.value)} /></label>
    </div>
    {state.status === "error" && <div aria-live="polite" className="form-feedback error" role="alert"><Icon name="info" size={15} />{state.message}</div>}
    {state.status === "success" && <div aria-live="polite" className="form-feedback success" role="status"><Icon name="check" size={15} />{state.message}</div>}
    <div className="password-form-footer"><span>Email baru langsung dipakai untuk login berikutnya.</span><button className="button button-primary" disabled={state.status === "loading"} type="submit">{state.status === "loading" ? "Menyimpan..." : "Simpan profil"}<Icon name="arrow" size={15} /></button></div>
  </form>;
}
