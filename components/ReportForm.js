"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icons";

export default function ReportForm({ jobdesks, initialJobdeskId = "" }) {
  const selectedJobdeskId = jobdesks.some((item) => item.id === initialJobdeskId) ? initialJobdeskId : jobdesks[0]?.id || "";
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), jobdeskId: selectedJobdeskId, report: "", progress: 0, status: "ON_PROGRESS", notes: "" });
  const selectedJobdesk = jobdesks.find((item) => item.id === form.jobdeskId) || null;
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const draftKey = `ss3o-report-draft:${jobdesks[0]?.userId || "staff"}`;

  useEffect(() => {
    try {
      const draft = window.localStorage.getItem(draftKey);
      if (draft) setForm((current) => ({ ...current, ...JSON.parse(draft) }));
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, []);

  function update(name, value) { setForm((current) => ({ ...current, [name]: value })); }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Report gagal disimpan");
      setMessage("Report berhasil disimpan.");
      setForm((current) => ({ ...current, report: "", notes: "" }));
      window.localStorage.removeItem(draftKey);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={submit}>
      <div className="form-grid">
        <div className="form-group"><label className="form-label">Tanggal</label><input className="field form-control" type="date" value={form.date} onChange={(event) => update("date", event.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Jobdesk</label><select className="select form-control" value={form.jobdeskId} onChange={(event) => update("jobdeskId", event.target.value)} required><option value="">Pilih jobdesk</option>{jobdesks.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
        <div className="form-group full"><label className="form-label">Report Hasil Kerja</label><textarea className="field form-control textarea" placeholder="Tuliskan pekerjaan yang sudah diselesaikan hari ini..." value={form.report} onChange={(event) => update("report", event.target.value)} required /></div>
        {selectedJobdesk?.targetCount ? <div className="form-group"><label className="form-label">Progress (otomatis)</label><p style={{ background: "rgba(0,0,0,.03)", borderRadius: 8, fontSize: 12, lineHeight: 1.6, margin: 0, padding: "9px 11px" }}>Progress jobdesk ini dihitung otomatis dari jumlah submit yang sudah di-<strong>Approve</strong> Admin: <strong>{selectedJobdesk.approvedCount}/{selectedJobdesk.targetCount}</strong> ({selectedJobdesk.progress}%). Progress akan bertambah setelah report ini di-approve.</p></div> : <div className="form-group"><label className="form-label">Progress <strong>{form.progress}%</strong></label><input className="form-control" type="range" min="0" max="100" value={form.progress} onChange={(event) => update("progress", Number(event.target.value))} /></div>}
        <div className="form-group"><label className="form-label">Status</label><select className="select form-control" value={form.status} onChange={(event) => update("status", event.target.value)}><option value="ON_PROGRESS">On Progress</option><option value="COMPLETED">Completed</option><option value="PENDING">Pending</option></select></div>
        <div className="form-group full"><label className="form-label">Catatan</label><textarea className="field form-control" rows="3" placeholder="Tambahkan catatan bila diperlukan..." value={form.notes} onChange={(event) => update("notes", event.target.value)} /></div>
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 21 }}>
        {message && <span style={{ color: message.includes("berhasil") ? "var(--green)" : "var(--red)", fontSize: 12, marginRight: "auto" }}>{message}</span>}
        <button className="button button-ghost" type="button" onClick={() => { window.localStorage.setItem(draftKey, JSON.stringify(form)); setMessage("Draft tersimpan di perangkat ini."); }}>Simpan Draft</button>
        <button className="button button-primary" disabled={saving || !jobdesks.length} type="submit">{saving ? "Menyimpan..." : "Submit Report"} <Icon name="arrow" size={14} /></button>
      </div>
    </form>
  );
}