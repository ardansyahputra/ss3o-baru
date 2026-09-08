"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/Icons";
import ReviewDrawer from "@/components/ReviewDrawer";
import ImagePreview from "@/components/ImagePreview";

export default function UploadAdminView({ uploads }) {
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const filtered = useMemo(() => uploads.filter((item) => (type === "all" || item.type === type) && (status === "all" || item.approvalStatus === status)), [uploads, type, status]);
  function exportSummary() {
    const header = ["File", "Staff", "Jenis", "Sumber", "Jobdesk", "Tanggal", "Status"];
    const lines = filtered.map((item) => [item.fileName, item.userName, item.typeLabel, item.source || "Perangkat", item.jobdeskTitle || "", item.date || "", item.approvalStatus].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
    const blob = new Blob([`\ufeff${[header.join(","), ...lines].join("\n")}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ss3o-upload-summary.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return <div className="card section-card"><div className="filter-bar"><select className="select" value={type} onChange={(event) => setType(event.target.value)}><option value="all">Semua jenis upload</option><option value="work">Hasil Kerja</option><option value="lxp">LXP</option><option value="dsr">DSR Staff</option></select><select className="select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Semua status</option><option value="PENDING">Menunggu Review</option><option value="APPROVED">Disetujui</option><option value="REVISION">Perlu Revisi</option></select><button className="button button-secondary" style={{ marginLeft: "auto" }} onClick={exportSummary}><Icon name="file" size={14} /> Export Summary Report</button></div>{filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>File</th><th>Staff</th><th>Jenis</th><th>Sumber</th><th>Jobdesk</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filtered.map((item) => <tr key={`${item.type}-${item.id}`}><td><div className="table-title-row"><div className="table-title">{item.fileName}</div>{item.mimeType?.startsWith("image/") && <ImagePreview caption={`${item.userName} · ${item.jobdeskTitle || item.typeLabel}`} label={item.fileName} src={item.filePath} />}</div><div className="table-muted">{Math.ceil((item.size || 0) / 1024)} KB</div></td><td>{item.userName}</td><td>{item.typeLabel}</td><td><span className="status status-progress">{item.source || "Perangkat"}</span></td><td>{item.jobdeskTitle || "-"}</td><td>{item.date || "-"}</td><td><span className={`status ${item.approvalStatus === "APPROVED" ? "status-completed" : item.approvalStatus === "REVISION" ? "status-revision" : "status-pending"}`}>{item.approvalStatus === "APPROVED" ? "Disetujui" : item.approvalStatus === "REVISION" ? "Perlu Revisi" : "Menunggu Review"}</span></td><td><button className="review-button" onClick={() => setSelected(item)}>Inspect <Icon name="arrow" size={13} /></button></td></tr>)}</tbody></table></div> : <div className="empty-state"><Icon name="upload" size={28} /><strong>Belum ada dokumen</strong><p>Upload staff akan muncul di sini untuk diperiksa.</p></div>}{selected && <ReviewDrawer person={{ name: selected.userName, department: selected.department, position: selected.position, progress: 0, jobs: [], report: null, uploads: [selected], uploadCount: 1 }} onClose={() => setSelected(null)} onReviewed={() => setSelected(null)} />}</div>;
}