"use client";

import { useState } from "react";
import Icon from "@/components/Icons";

const initialForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ChangePasswordForm() {
  const [form, setForm] = useState(initialForm);
  const [show, setShow] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [state, setState] = useState({ status: "idle", message: "" });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (state.status !== "idle") setState({ status: "idle", message: "" });
  }

  function toggle(field) {
    setShow((current) => ({ ...current, [field]: !current[field] }));
  }

  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState({ status: "error", message: result.error || "Password belum dapat diubah." });
        return;
      }
      setForm(initialForm);
      setState({ status: "success", message: result.message || "Password berhasil diubah." });
    } catch {
      setState({ status: "error", message: "Tidak dapat terhubung ke server. Coba lagi." });
    }
  }

  const fields = [
    ["currentPassword", "Password lama", "Masukkan password yang sedang dipakai"],
    ["newPassword", "Password baru", "Minimal 8 karakter"],
    ["confirmPassword", "Konfirmasi password baru", "Ulangi password baru"]
  ];

  return <form aria-label="Form ubah password" className="password-form" onSubmit={submit}>
    <div className="password-form-intro"><span className="security-badge"><Icon name="shield" size={16} /></span><div><strong>Amankan akun kamu</strong><p>Password tersimpan dalam bentuk hash dan tidak pernah ditampilkan kembali.</p></div></div>
    <div className="password-fields">
      {fields.map(([field, label, placeholder]) => <label className="form-group password-field" htmlFor={`password-${field}`} key={field}><span className="form-label">{label}</span><span className="password-input-wrap"><input aria-describedby={`password-hint-${field}`} autoComplete={field === "currentPassword" ? "current-password" : "new-password"} className="form-control" id={`password-${field}`} minLength={field === "currentPassword" ? undefined : 8} placeholder={placeholder} required type={show[field] ? "text" : "password"} value={form[field]} onChange={(event) => update(field, event.target.value)} /><button aria-label={show[field] ? `Sembunyikan ${label.toLowerCase()}` : `Tampilkan ${label.toLowerCase()}`} className="password-visibility" onClick={() => toggle(field)} type="button">{show[field] ? "Hide" : "Show"}</button></span>{field !== "currentPassword" && <small className="field-hint" id={`password-hint-${field}`}>Minimal 8 karakter</small>}</label>)}
    </div>
    {state.status === "error" && <div aria-live="polite" className="form-feedback error" role="alert"><Icon name="info" size={15} />{state.message}</div>}
    {state.status === "success" && <div aria-live="polite" className="form-feedback success" role="status"><Icon name="check" size={15} />{state.message}</div>}
    <div className="password-form-footer"><span>Session aktif tidak akan terputus.</span><button className="button button-primary" disabled={state.status === "loading"} type="submit">{state.status === "loading" ? "Menyimpan..." : "Simpan password"}<Icon name="arrow" size={15} /></button></div>
  </form>;
}