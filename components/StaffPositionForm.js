"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";

export default function StaffPositionForm({ staffId, currentPosition, options }) {
  const router = useRouter();
  const [position, setPosition] = useState(currentPosition || options[0]);
  // savedPosition dilacak terpisah dari currentPosition (prop dari server)
  // supaya begitu simpan sukses, tombol & status langsung update SAAT ITU
  // JUGA tanpa menunggu round-trip router.refresh() selesai. router.refresh()
  // tetap dipanggil di background untuk sinkronkan data halaman, tapi UI
  // tidak lagi menunggunya — jadi pindah posisi berturut-turut terasa instan.
  const [savedPosition, setSavedPosition] = useState(currentPosition || options[0]);
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    if (position === savedPosition) return;
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState({ status: "error", message: result.error || "Posisi belum dapat diubah." });
        return;
      }
      setSavedPosition(position);
      setState({ status: "success", message: "Posisi berhasil diubah." });
      router.refresh();
    } catch {
      setState({ status: "error", message: "Tidak dapat terhubung ke server. Coba lagi." });
    }
  }

  // Kalau posisi yang tersimpan saat ini ternyata belum ada di daftar
  // options (mis. posisi lama yang penulisannya beda), tetap tampilkan
  // sebagai pilihan pertama supaya dropdown tidak diam-diam pindah ke
  // opsi lain dan bikin salah simpan.
  const selectOptions = savedPosition && !options.includes(savedPosition) ? [savedPosition, ...options] : options;

  return <form className="password-form" style={{ marginTop: 10 }} onSubmit={submit}>
    <div className="password-fields" style={{ alignItems: "flex-end" }}>
      <label className="form-group password-field" htmlFor="staff-position" style={{ flex: 1 }}>
        <span className="form-label">Posisi</span>
        <select className="select" id="staff-position" value={position} onChange={(event) => { setPosition(event.target.value); setState({ status: "idle", message: "" }); }}>
          {selectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <button className="button button-primary" disabled={state.status === "loading" || position === savedPosition} type="submit">{state.status === "loading" ? "Menyimpan..." : "Simpan posisi"}<Icon name="arrow" size={15} /></button>
    </div>
    {state.status === "error" && <div aria-live="polite" className="form-feedback error" role="alert" style={{ marginTop: 8 }}><Icon name="info" size={15} />{state.message}</div>}
    {state.status === "success" && <div aria-live="polite" className="form-feedback success" role="status" style={{ marginTop: 8 }}><Icon name="check" size={15} />{state.message}</div>}
  </form>;
}
