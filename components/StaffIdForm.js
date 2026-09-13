"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";

export default function StaffIdForm({ staffId, currentStaffCode }) {
  const router = useRouter();
  const [staffCode, setStaffCode] = useState(currentStaffCode || "");
  const [savedStaffCode, setSavedStaffCode] = useState(currentStaffCode || "");
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    if (!staffCode.trim() || staffCode.trim() === savedStaffCode) return;
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffCode: staffCode.trim() })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState({ status: "error", message: result.error || "ID staff belum dapat diubah." });
        return;
      }
      setSavedStaffCode(staffCode.trim());
      setState({ status: "success", message: "ID staff berhasil diubah." });
      router.refresh();
    } catch {
      setState({ status: "error", message: "Tidak dapat terhubung ke server. Coba lagi." });
    }
  }

  return <form className="password-form" style={{ marginTop: 10 }} onSubmit={submit}>
    <div className="password-fields" style={{ alignItems: "flex-end" }}>
      <label className="form-group password-field" htmlFor="staff-id-code" style={{ flex: 1 }}>
        <span className="form-label">ID Staff</span>
        <input className="form-control" id="staff-id-code" placeholder="mis. STF-021" value={staffCode} onChange={(event) => { setStaffCode(event.target.value); if (state.status !== "idle") setState({ status: "idle", message: "" }); }} />
      </label>
      <button className="button button-primary" disabled={state.status === "loading" || !staffCode.trim() || staffCode.trim() === savedStaffCode} type="submit">{state.status === "loading" ? "Menyimpan..." : "Simpan ID staff"}<Icon name="arrow" size={15} /></button>
    </div>
    {state.status === "error" && <div aria-live="polite" className="form-feedback error" role="alert" style={{ marginTop: 8 }}><Icon name="info" size={15} />{state.message}</div>}
    {state.status === "success" && <div aria-live="polite" className="form-feedback success" role="status" style={{ marginTop: 8 }}><Icon name="check" size={15} />{state.message}</div>}
  </form>;
}
