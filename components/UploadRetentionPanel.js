"use client";

import { useState } from "react";
import Icon from "@/components/Icons";

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Panel status retensi bukti upload — cuma tampil buat Admin (Dika) di
// halaman Kelola Bukti Upload. Menunjukkan berapa banyak bukti yang masih
// tersimpan sekarang, kapan terakhir & kapan jadwal berikutnya dihapus
// otomatis (siklus 8 hari), plus tombol buat hapus sekarang juga.
export default function UploadRetentionPanel({ initialStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [purging, setPurging] = useState(false);
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function refresh() {
    try {
      const response = await fetch("/api/uploads/purge");
      const data = await response.json();
      if (data.ok) setStatus({ storedCount: data.storedCount, lastPurgedAt: data.lastPurgedAt, nextPurgeAt: data.nextPurgeAt });
    } catch {
      // Diamkan — panel cukup pakai status terakhir yang sudah ada.
    }
  }

  async function purgeNow() {
    setPurging(true);
    setMessage("");
    try {
      const response = await fetch("/api/uploads/purge", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Gagal menghapus bukti upload.");
      setMessage(`${data.deletedCount} berkas bukti upload berhasil dihapus.`);
      setConfirming(false);
      await refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPurging(false);
    }
  }

  return <div className="card section-card" style={{ marginBottom: 18 }}>
    <div className="card-heading">
      <div><h2>Retensi Bukti Upload</h2><p>Semua bukti upload (Hasil Kerja/LXP/DSR) otomatis dihapus tiap 8 hari sekali supaya storage tidak penuh. Data staff, jobdesk, dan report tidak ikut terhapus.</p></div>
    </div>
    <div className="filter-bar" style={{ alignItems: "center" }}>
      <span className="status status-progress"><Icon name="file" size={13} /> {status.storedCount} berkas tersimpan</span>
      <span style={{ color: "var(--muted)", fontSize: 12 }}>Terakhir dihapus: {formatDate(status.lastPurgedAt)}</span>
      <span style={{ color: "var(--muted)", fontSize: 12 }}>Jadwal berikutnya: {formatDate(status.nextPurgeAt)}</span>
      {!confirming
        ? <button className="button button-danger" style={{ marginLeft: "auto" }} onClick={() => setConfirming(true)} type="button" disabled={purging}><Icon name="close" size={13} /> Hapus Sekarang</button>
        : <div style={{ alignItems: "center", display: "flex", gap: 8, marginLeft: "auto" }}>
            <span style={{ color: "var(--red)", fontSize: 12 }}>Yakin hapus SEMUA bukti upload sekarang?</span>
            <button className="button button-ghost" onClick={() => setConfirming(false)} type="button" disabled={purging}>Batal</button>
            <button className="button button-danger" onClick={purgeNow} type="button" disabled={purging}>{purging ? "Menghapus..." : "Ya, Hapus"}</button>
          </div>}
    </div>
    {message && <p style={{ color: message.includes("berhasil") ? "var(--green)" : "var(--red)", fontSize: 12, marginTop: 8 }}>{message}</p>}
  </div>;
}
