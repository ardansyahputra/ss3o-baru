"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/Icons";
import ReviewDrawer from "@/components/ReviewDrawer";

export default function UploadAdminView({ uploads }) {
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  // Salinan lokal dari uploads supaya status approve/revisi/reject bisa
  // langsung ter-update di daftar folder tanpa perlu reload halaman.
  const [items, setItems] = useState(uploads);

  const filtered = useMemo(() => items.filter((item) => (type === "all" || item.type === type) && (status === "all" || item.approvalStatus === status)), [items, type, status]);

  // Kelompokkan berkas per staff jadi "folder" — supaya daftar tidak
  // memanjang satu-satu per file. Admin cukup pencet nama staff (mis.
  // "Junan") untuk lihat semua berkas yang staff itu upload.
  const folders = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      const key = item.userId || item.userName;
      if (!map.has(key)) map.set(key, { key, userId: item.userId, name: item.userName, department: item.department, position: item.position, uploads: [] });
      map.get(key).uploads.push(item);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

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

  function reviewed(change) {
    setItems((current) => current.map((item) => item.id === change.targetId ? { ...item, approvalStatus: change.action } : item));
    setSelected((current) => current ? { ...current, uploads: current.uploads.map((upload) => upload.id === change.targetId ? { ...upload, approvalStatus: change.action } : upload) } : current);
  }

  return <div className="card section-card">
    <div className="filter-bar">
      <select className="select" value={type} onChange={(event) => setType(event.target.value)}><option value="all">Semua jenis upload</option><option value="work">Hasil Kerja</option><option value="lxp">LXP</option><option value="dsr">DSR Staff</option></select>
      <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Semua status</option><option value="PENDING">Menunggu Review</option><option value="APPROVED">Disetujui</option><option value="REVISION">Perlu Revisi</option></select>
      <span style={{ color: "var(--muted)", fontSize: 11, marginLeft: "auto" }}>{folders.length} staff · {filtered.length} berkas</span>
      <button className="button button-secondary" onClick={exportSummary}><Icon name="file" size={14} /> Export Summary Report</button>
    </div>
    {folders.length
      ? <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Staff</th><th>Jenis</th><th>Upload Terakhir</th><th>Jumlah Berkas</th><th>Aksi</th></tr></thead>
            <tbody>
              {folders.map((folder) => {
                const pendingCount = folder.uploads.filter((item) => item.approvalStatus === "PENDING").length;
                const latestDate = folder.uploads.reduce((latest, item) => (!latest || (item.date || "") > latest ? item.date : latest), "");
                const typeLabels = [...new Set(folder.uploads.map((item) => item.typeLabel))];
                return <tr key={folder.key}>
                  <td><div className="person"><span className="avatar">{folder.name.slice(0, 2).toUpperCase()}</span><div className="person-copy"><strong>{folder.name}</strong><span>{folder.position} · {folder.department}</span></div></div></td>
                  <td>{typeLabels.join(", ")}</td>
                  <td>{latestDate || "-"}</td>
                  <td><span className="upload-count"><Icon name="file" size={13} /> {folder.uploads.length} berkas{pendingCount ? ` · ${pendingCount} menunggu` : ""}</span></td>
                  <td><button className="review-button" onClick={() => setSelected(folder)}>Lihat Upload <Icon name="arrow" size={13} /></button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      : <div className="empty-state"><Icon name="upload" size={28} /><strong>Belum ada dokumen</strong><p>Upload staff akan muncul di sini untuk diperiksa.</p></div>}
    {selected && <ReviewDrawer person={{ name: selected.name, department: selected.department, position: selected.position, progress: 0, jobs: [], report: null, uploads: selected.uploads, uploadCount: selected.uploads.length }} onClose={() => setSelected(null)} onReviewed={reviewed} />}
  </div>;
}
