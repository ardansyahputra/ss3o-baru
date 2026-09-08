"use client";

import { useState } from "react";
import Icon from "@/components/Icons";

export default function ReviewDrawer({ person, onClose, onReviewed }) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  if (!person) return null;

  async function review(targetType, targetId, action) {
    if ((action === "REVISION" || action === "REJECTED") && !notes.trim()) { setShowNotes(true); return; }
    setSaving(true);
    const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType, targetId, action, notes }) });
    const result = await response.json();
    setSaving(false);
    if (response.ok) { onReviewed?.({ targetType, targetId, action, notes }); setNotes(""); setShowNotes(false); }
    else window.alert(result.error || "Review gagal disimpan.");
  }

  return <div className="drawer-backdrop" onClick={onClose}><aside className="review-drawer" onClick={(event) => event.stopPropagation()}>
    <div className="drawer-head"><div><p className="eyebrow">Proof inspection</p><h2>{person.name}</h2><p>{person.department} · {person.position}</p></div><button aria-label="Tutup review" className="icon-button" onClick={onClose} type="button"><Icon name="plus" size={18} className="close-icon" /></button></div>
    <div className="drawer-body">
      <div className="drawer-summary"><div><span>Progress</span><strong>{person.progress || 0}%</strong></div><div><span>Jobdesk</span><strong>{person.jobs?.length || 0}</strong></div><div><span>Uploads</span><strong>{person.uploadCount ?? person.uploads?.length ?? 0}</strong></div></div>
      <section className="drawer-section"><div className="drawer-section-title"><h3>Jobdesk hari ini</h3><span>{person.jobs?.length || 0} item</span></div>{person.jobs?.length ? person.jobs.map((job) => <div className="drawer-job" key={job.id}><span className={`priority priority-${job.priority}`}>{job.priority}</span><div><strong>{job.title}</strong><div className="mini-progress"><div className="progress-track"><div className="progress-fill" style={{ width: `${job.progress}%` }} /></div><span>{job.progress}% · {job.statusText}</span></div></div></div>) : <p className="drawer-muted">Belum ada jobdesk.</p>}</section>
      <section className="drawer-section"><div className="drawer-section-title"><h3>Catatan staff</h3>{person.report && <span>{person.report.date}</span>}</div>{person.report ? <div className="report-note"><p>{person.report.report}</p>{person.report.notes && <small>{person.report.notes}</small>}</div> : <p className="drawer-muted">Belum ada report yang disubmit.</p>}</section>
      <section className="drawer-section"><div className="drawer-section-title"><h3>Bukti upload</h3><span>{person.uploads?.length || 0} berkas</span></div>{person.uploads?.length ? <div className="proof-grid">{person.uploads.map((upload) => <div className="proof-card" key={upload.id}>{upload.mimeType?.startsWith("image/") && upload.filePath ? <img alt={upload.fileName} src={upload.filePath} /> : <div className="proof-file"><Icon name="file" size={25} /><strong>{upload.fileName}</strong><span>{upload.typeLabel} · {upload.source || "Perangkat"} · {upload.jobdeskTitle || "Tanpa jobdesk"} · {Math.ceil((upload.size || 0) / 1024)} KB</span></div>}<div className="proof-card-foot"><span className="status status-progress">{upload.source || "Perangkat"}</span><span className={`status ${upload.approvalStatus === "APPROVED" ? "status-completed" : upload.approvalStatus === "REVISION" || upload.approvalStatus === "REJECTED" ? "status-revision" : "status-pending"}`}>{upload.approvalStatus === "APPROVED" ? "Disetujui" : upload.approvalStatus === "REVISION" ? "Revisi" : upload.approvalStatus === "REJECTED" ? "Ditolak" : "Review"}</span>{upload.filePath && <a className="text-link" href={upload.filePath} download>Unduh</a>}</div><div className="proof-actions"><button onClick={() => review("upload", upload.id, "APPROVED")} disabled={saving}>Approve</button><button onClick={() => review("upload", upload.id, "REVISION")} disabled={saving}>Revisi</button><button onClick={() => review("upload", upload.id, "REJECTED")} disabled={saving}>Reject</button></div></div>)}</div> : <div className="drawer-empty"><Icon name="upload" size={22} /><span>Belum ada berkas upload.</span></div>}</section>
    </div>
    {person.report && <div className="drawer-actions">{showNotes && <textarea className="field" placeholder="Catatan revisi / alasan penolakan..." value={notes} onChange={(event) => setNotes(event.target.value)} />}{showNotes && <button className="button button-ghost" onClick={() => review("report", person.report.id, "REVISION")} disabled={saving}>Kirim Catatan</button>}<div className="drawer-action-row"><button className="button button-danger" onClick={() => review("report", person.report.id, "REJECTED")} disabled={saving}>Reject</button><button className="button button-ghost" onClick={() => setShowNotes(!showNotes)} disabled={saving}>Minta Revisi</button><button className="button button-primary" onClick={() => review("report", person.report.id, "APPROVED")} disabled={saving}><Icon name="check" size={14} /> Approve</button></div></div>}
  </aside></div>;
}