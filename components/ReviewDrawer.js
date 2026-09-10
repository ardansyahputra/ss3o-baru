"use client";

import { useState } from "react";
import Icon from "@/components/Icons";
import ImagePreview from "@/components/ImagePreview";
import Toast from "@/components/Toast";
import ReviewSuccessModal from "@/components/ReviewSuccessModal";

export default function ReviewDrawer({ person, onClose, onReviewed }) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  // ID upload yang sedang ditolak — dipakai untuk menampilkan kotak alasan
  // reject langsung di kartu bukti upload tersebut (bukan di form).
  const [rejectingUploadId, setRejectingUploadId] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  if (!person) return null;

  async function review(targetType, targetId, action, targetName, notesOverride) {
    const noteToSend = notesOverride !== undefined ? notesOverride : notes;
    if ((action === "REVISION" || action === "REJECTED") && !noteToSend.trim()) { setShowNotes(true); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType, targetId, action, notes: noteToSend }) });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        onReviewed?.({ targetType, targetId, action, notes: noteToSend });
        setNotes("");
        setShowNotes(false);
        setRejectingUploadId(null);
        setRejectNote("");
        // Modal sukses jadi konfirmasi utama (lebih kelihatan daripada toast
        // kecil), sekaligus menegaskan perubahan sudah otomatis tersinkron
        // ke dashboard staff. Toast tetap dipakai khusus untuk error.
        setSuccessResult({ action, targetName: targetName || person.name });
      } else {
        setToast({ type: "error", message: result.error || "Review gagal disimpan." });
      }
    } catch {
      setToast({ type: "error", message: "Tidak dapat terhubung ke server. Coba lagi." });
    } finally {
      setSaving(false);
    }
  }

  function startReject(uploadId) {
    setRejectingUploadId(uploadId);
    setRejectNote("");
  }

  function confirmReject(upload) {
    if (!rejectNote.trim()) return;
    review("upload", upload.id, "REJECTED", upload.fileName, rejectNote);
  }

  return <div className="drawer-backdrop" onClick={onClose}><aside className="review-drawer" onClick={(event) => event.stopPropagation()}>
    <div className="drawer-head"><div><p className="eyebrow">Proof inspection</p><h2>{person.name}</h2><p>{person.department} · {person.position}</p></div><button aria-label="Tutup review" className="icon-button" onClick={onClose} type="button"><Icon name="plus" size={18} className="close-icon" /></button></div>
    <div className="drawer-body">
      <div className="drawer-summary"><div><span>Progress</span><strong>{person.progress || 0}%</strong></div><div><span>Jobdesk</span><strong>{person.jobs?.length || 0}</strong></div><div><span>Uploads</span><strong>{person.uploadCount ?? person.uploads?.length ?? 0}</strong></div></div>
      <section className="drawer-section"><div className="drawer-section-title"><h3>Jobdesk hari ini</h3><span>{person.jobs?.length || 0} item</span></div>{person.jobs?.length ? person.jobs.map((job) => <div className="drawer-job" key={job.id}><span className={`priority priority-${job.priority}`}>{job.priority}</span><div><strong>{job.title}</strong><div className="mini-progress"><div className="progress-track"><div className="progress-fill" style={{ width: `${job.progress}%` }} /></div><span>{job.progress}% · {job.statusText}</span></div></div></div>) : <p className="drawer-muted">Belum ada jobdesk.</p>}</section>
      <section className="drawer-section"><div className="drawer-section-title"><h3>Catatan staff</h3>{person.report && <span>{person.report.date}</span>}</div>{person.report ? <div className="report-note"><p>{person.report.report}</p>{person.report.notes && <small>{person.report.notes}</small>}</div> : <p className="drawer-muted">Belum ada report yang disubmit.</p>}</section>
      <section className="drawer-section"><div className="drawer-section-title"><h3>Bukti upload</h3><span>{person.uploads?.length || 0} berkas</span></div>{person.uploads?.length ? <div className="proof-grid">{person.uploads.map((upload) => {
        const isImage = upload.mimeType?.startsWith("image/") && upload.filePath;
        return <div className="proof-card" key={upload.id}>
          {isImage
            ? <div className="proof-thumb"><img alt={upload.fileName} src={upload.filePath} /><ImagePreview src={upload.filePath} label={upload.fileName} caption={`${upload.typeLabel} · ${upload.jobdeskTitle || "Tanpa jobdesk"}`} /></div>
            : <div className="proof-file"><Icon name="file" size={25} /><strong>{upload.fileName}</strong><span>{upload.typeLabel} · {upload.source || "Perangkat"} · {upload.jobdeskTitle || "Tanpa jobdesk"} · {Math.ceil((upload.size || 0) / 1024)} KB</span></div>}
          {upload.notes && <div className="proof-note"><Icon name="info" size={11} /><span>{upload.notes}</span></div>}
          <div className="proof-card-foot"><span className="status status-progress">{upload.source || "Perangkat"}</span><span className={`status ${upload.approvalStatus === "APPROVED" ? "status-completed" : upload.approvalStatus === "REVISION" || upload.approvalStatus === "REJECTED" ? "status-revision" : "status-pending"}`}>{upload.approvalStatus === "APPROVED" ? "Disetujui" : upload.approvalStatus === "REVISION" ? "Revisi" : upload.approvalStatus === "REJECTED" ? "Ditolak" : "Review"}</span>{upload.filePath && <a className="text-link" href={upload.filePath} download>Unduh</a>}</div>
          {rejectingUploadId === upload.id
            ? <div className="proof-reject-box">
                <textarea className="field form-control" rows="2" autoFocus placeholder="Tulis alasan reject untuk staff..." value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} />
                <div className="proof-reject-box-actions">
                  <button className="button button-ghost" type="button" onClick={() => { setRejectingUploadId(null); setRejectNote(""); }} disabled={saving}>Batal</button>
                  <button className="proof-action proof-action-reject" type="button" onClick={() => confirmReject(upload)} disabled={saving || !rejectNote.trim()}><Icon name="close" size={12} /> Konfirmasi Reject</button>
                </div>
              </div>
            : <div className="proof-actions">
                <button className="proof-action proof-action-approve" onClick={() => review("upload", upload.id, "APPROVED", upload.fileName)} disabled={saving}><Icon name="check" size={12} /> Approve</button>
                <button className="proof-action proof-action-reject" onClick={() => startReject(upload.id)} disabled={saving}><Icon name="close" size={12} /> Reject</button>
              </div>}
        </div>;
      })}</div> : <div className="drawer-empty"><Icon name="upload" size={22} /><span>Belum ada berkas upload.</span></div>}</section>
    </div>
    {person.report && <div className="drawer-actions">{showNotes && <textarea className="field" placeholder="Catatan revisi / alasan penolakan..." value={notes} onChange={(event) => setNotes(event.target.value)} />}{showNotes && <button className="button button-ghost" onClick={() => review("report", person.report.id, "REVISION", "Laporan harian")} disabled={saving}>Kirim Catatan</button>}<div className="drawer-action-row"><button className="button button-danger" onClick={() => review("report", person.report.id, "REJECTED", "Laporan harian")} disabled={saving}>Reject</button><button className="button button-ghost" onClick={() => setShowNotes(!showNotes)} disabled={saving}>Minta Revisi</button><button className="button button-primary" onClick={() => review("report", person.report.id, "APPROVED", "Laporan harian")} disabled={saving}><Icon name="check" size={14} /> Approve</button></div></div>}
    <Toast toast={toast} onClose={() => setToast(null)} />
    <ReviewSuccessModal result={successResult} onClose={() => setSuccessResult(null)} />
  </aside></div>;
}
