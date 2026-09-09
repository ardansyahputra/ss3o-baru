"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";

const ROLE_OPTIONS = [
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Administrator" }
];

export default function StaffRoleForm({ staffId, currentRole }) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole || "STAFF");
  // savedRole dilacak terpisah dari currentRole (prop dari server) supaya
  // begitu simpan sukses, tombol & status langsung update SAAT ITU JUGA
  // tanpa menunggu round-trip router.refresh() selesai. router.refresh()
  // tetap dipanggil di background untuk sinkronkan data halaman, tapi UI
  // tidak lagi menunggunya — jadi pindah role berturut-turut terasa instan.
  const [savedRole, setSavedRole] = useState(currentRole || "STAFF");
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    if (role === savedRole) return;
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState({ status: "error", message: result.error || "Role belum dapat diubah." });
        return;
      }
      setSavedRole(role);
      setState({ status: "success", message: "Role berhasil diubah." });
      router.refresh();
    } catch {
      setState({ status: "error", message: "Tidak dapat terhubung ke server. Coba lagi." });
    }
  }

  return <form className="password-form" style={{ marginTop: 10 }} onSubmit={submit}>
    <div className="password-fields" style={{ alignItems: "flex-end" }}>
      <label className="form-group password-field" htmlFor="staff-role" style={{ flex: 1 }}>
        <span className="form-label">Role</span>
        <select className="select" id="staff-role" value={role} onChange={(event) => { setRole(event.target.value); setState({ status: "idle", message: "" }); }}>
          {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <button className="button button-primary" disabled={state.status === "loading" || role === savedRole} type="submit">{state.status === "loading" ? "Menyimpan..." : "Simpan role"}<Icon name="arrow" size={15} /></button>
    </div>
    {state.status === "error" && <div aria-live="polite" className="form-feedback error" role="alert" style={{ marginTop: 8 }}><Icon name="info" size={15} />{state.message}</div>}
    {state.status === "success" && <div aria-live="polite" className="form-feedback success" role="status" style={{ marginTop: 8 }}><Icon name="check" size={15} />{state.message}</div>}
  </form>;
}
