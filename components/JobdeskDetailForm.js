"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JobdeskDetailForm({ jobdeskId, currentDescription, currentTarget }) {
  const router = useRouter();
  const [description, setDescription] = useState(currentDescription || "");
  const [targetCount, setTargetCount] = useState(currentTarget ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/jobdesks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobdeskId, description, targetCount: targetCount === "" ? null : targetCount }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menyimpan.");
      setMessage("Tersimpan.");
      router.refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
      <div className="form-group full">
        <label className="form-label">Detail jobdesk (tampil ke staff sebagai acuan)</label>
        <textarea className="field form-control textarea" rows="4" placeholder="Contoh: Report Malam mencakup closing kasir, cek CCTV, rekap penjualan harian, dan serah terima shift." value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <div className="form-group" style={{ maxWidth: 260 }}>
        <label className="form-label">Target jumlah submit (kumulatif, opsional)</label>
        <input className="field form-control" type="number" min="1" placeholder="Kosongkan jika manual" value={targetCount} onChange={(event) => setTargetCount(event.target.value)} />
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
        <button className="button button-primary" disabled={saving} type="submit">{saving ? "Menyimpan..." : "Simpan"}</button>
        {message && <span style={{ color: message === "Tersimpan." ? "var(--green)" : "var(--red)", fontSize: 12 }}>{message}</span>}
      </div>
    </form>
  );
}
