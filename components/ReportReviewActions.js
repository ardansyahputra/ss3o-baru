"use client";

import { useState } from "react";
import Icon from "@/components/Icons";

function statusLabel(status) {
  return status === "APPROVED" ? "Disetujui" : status === "REVISION" ? "Perlu Revisi" : status === "REJECTED" ? "Ditolak" : "Menunggu Review";
}

export default function ReportReviewActions({ reportId, initialStatus = "PENDING" }) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function review(action) {
    if ((action === "REVISION" || action === "REJECTED") && !notes.trim()) {
      setShowNotes(true);
      setMessage("Tambahkan catatan sebelum mengirim keputusan.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: "report", targetId: reportId, action, notes }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Review gagal disimpan.");
      setStatus(action);
      setNotes("");
      setShowNotes(false);
      setMessage(`Review berhasil disimpan: ${statusLabel(action)}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return <div className="report-review-actions">
    <span className={`status ${status === "APPROVED" ? "status-completed" : status === "REVISION" || status === "REJECTED" ? "status-revision" : "status-pending"}`}>{statusLabel(status)}</span>
    {showNotes && <textarea aria-label="Catatan review" className="field" placeholder="Catatan revisi / alasan penolakan..." value={notes} onChange={(event) => setNotes(event.target.value)} />}
    {message && <span aria-live="polite" className="review-message">{message}</span>}
    <div className="drawer-action-row">
      <button className="button button-danger" disabled={saving} onClick={() => review("REJECTED")} type="button">Reject</button>
      <button className="button button-ghost" disabled={saving} onClick={() => showNotes ? review("REVISION") : setShowNotes(true)} type="button">{showNotes ? "Kirim Revisi" : "Minta Revisi"}</button>
      <button className="button button-primary" disabled={saving} onClick={() => review("APPROVED")} type="button"><Icon name="check" size={14} /> {saving ? "Menyimpan..." : "Approve"}</button>
    </div>
  </div>;
}