"use client";

import { useState } from "react";
import Icon from "@/components/Icons";

// Panel "Kirim Dokumen/Info ke Staff" — tombol inputan baru di menu Kelola
// Bukti Upload (admin) supaya admin bisa kirim file/catatan yang nanti
// otomatis muncul di halaman Upload Dokumen staff yang dituju (atau semua
// staff kalau dipilih "Semua Staff"). Murni fitur tambahan baru, tidak
// mengubah form review upload yang sudah ada di atas/bawahnya.
export default function AdminNoticePanel({ staffList = [], initialNotices = [] }) {
  const [open, setOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [notices, setNotices] = useState(initialNotices);

  async function send() {
    if (!notes.trim() && !file) { setMessage("Isi catatan atau lampirkan file dulu ya."); return; }
    setSending(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("notes", notes);
      if (targetUserId) body.append("targetUserId", targetUserId);
      if (file) body.append("file", file);
      const response = await fetch("/api/admin-notices", { method: "POST", body });
      let result = {};
      try { result = await response.json(); } catch { result = {}; }
      if (!response.ok) throw new Error(result.error || `Gagal mengirim (status ${response.status}).`);
      setNotices((current) => [{ ...result.record, targetName: targetUserId ? (staffList.find((staff) => staff.id === targetUserId)?.name || "-") : "Semua Staff" }, ...current]);
      setNotes("");
      setFile(null);
      setTargetUserId("");
      setMessage("Terkirim ke staff.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSending(false);
    }
  }

  async function removeNotice(id) {
    setNotices((current) => current.filter((item) => item.id !== id));
    try {
      await fetch("/api/admin-notices", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    } catch {
      // Kalau gagal hapus di server, tidak masalah besar — item akan tampil
      // lagi setelah halaman di-reload. Tidak perlu ganggu admin dengan alert.
    }
  }

  return <div className="card section-card" style={{ marginBottom: 16 }}>
    <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
      <div><strong style={{ fontSize: 13 }}>Kirim Dokumen / Info ke Staff</strong><p style={{ color: "var(--muted)", fontSize: 11, margin: "4px 0 0" }}>Bagikan file atau catatan — nanti otomatis muncul di halaman Upload Dokumen staff yang dituju.</p></div>
      <button className="button button-secondary" onClick={() => setOpen((current) => !current)} type="button"><Icon name={open ? "close" : "upload"} size={13} /> {open ? "Tutup" : "Kirim Dokumen"}</button>
    </div>
    {open && <div style={{ marginTop: 14 }}>
      <div className="form-grid">
        <div className="form-group"><label className="form-label">Kirim untuk</label><select className="select form-control" value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)}><option value="">Semua staff</option>{staffList.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Lampiran (opsional)</label><input className="field form-control" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} /></div>
        <div className="form-group full"><label className="form-label">Catatan</label><textarea className="field form-control textarea" placeholder="Tulis info atau instruksi untuk staff..." rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
      </div>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        {message && <span style={{ color: message === "Terkirim ke staff." ? "var(--green)" : "var(--red)", fontSize: 12, marginRight: "auto" }}>{message}</span>}
        <button className="button button-primary" disabled={sending} onClick={send}>{sending ? "Mengirim..." : "Kirim"} <Icon name="arrow" size={14} /></button>
      </div>
    </div>}
    {notices.length > 0 && <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 12 }}>
      <strong style={{ color: "#52657d", fontSize: 11 }}>Sudah dikirim ({notices.length})</strong>
      <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
        {notices.map((item) => <div key={item.id} style={{ alignItems: "flex-start", background: "#f6f8fa", borderRadius: 7, display: "flex", fontSize: 11.5, gap: 8, justifyContent: "space-between", padding: "8px 10px" }}>
          <div style={{ display: "grid", gap: 2 }}>
            <span><strong>{item.targetName || (item.targetUserId ? staffList.find((staff) => staff.id === item.targetUserId)?.name : "Semua Staff") || "Semua Staff"}</strong> · {(item.createdAt || "").slice(0, 10)}</span>
            {item.notes && <span style={{ color: "#52657d", whiteSpace: "pre-wrap" }}>{item.notes}</span>}
            {item.filePath && <a className="text-link" download href={item.filePath}>{item.fileName || "Lihat file"}</a>}
          </div>
          <button aria-label="Hapus" onClick={() => removeNotice(item.id)} style={{ background: "transparent", border: 0, color: "var(--red)", cursor: "pointer", flexShrink: 0 }} type="button"><Icon name="close" size={13} /></button>
        </div>)}
      </div>
    </div>}
  </div>;
}
