"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/Icons";
import ReviewDrawer from "@/components/ReviewDrawer";

export default function UploadAdminView({ uploads, staffProgress = {}, staffList = [] }) {
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  // Filter tanggal sekarang berupa rentang (dari - sampai) supaya admin bisa
  // lihat riwayat upload custom, misal 1-5 September, bukan cuma satu hari.
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // Filter nama staff supaya admin bisa langsung lihat riwayat upload staff
  // tertentu saja tanpa harus scroll cari di daftar folder.
  const [staffId, setStaffId] = useState("all");
  const [selected, setSelected] = useState(null);
  // "desc" = upload terbaru dulu, "asc" = upload terlama dulu.
  const [sortOrder, setSortOrder] = useState("desc");
  // Salinan lokal dari uploads supaya status approve/revisi/reject bisa
  // langsung ter-update di daftar folder tanpa perlu reload halaman.
  const [items, setItems] = useState(uploads);

  // Daftar staff untuk dropdown filter — gabungkan staffList (semua staff
  // aktif, walau belum pernah upload) dengan nama yang muncul di uploads,
  // supaya tetap lengkap walau staffList tidak dikirim dari parent.
  const staffFilterOptions = useMemo(() => {
    const map = new Map();
    for (const staff of staffList) map.set(staff.id, staff.name);
    for (const item of items) if (item.userId && !map.has(item.userId)) map.set(item.userId, item.userName);
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [staffList, items]);

  const filtered = useMemo(() => items.filter((item) => (type === "all" || item.type === type) && (status === "all" || item.approvalStatus === status) && (!dateFrom || (item.date || "") >= dateFrom) && (!dateTo || (item.date || "") <= dateTo) && (staffId === "all" || item.userId === staffId)), [items, type, status, dateFrom, dateTo, staffId]);

  // Kelompokkan berkas per staff jadi "folder" — supaya daftar tidak
  // memanjang satu-satu per file. Admin cukup pencet nama staff (mis.
  // "Junan") untuk lihat semua berkas yang staff itu upload.
  const folders = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      const key = item.userId || item.userName;
      if (!map.has(key)) {
        // Ambil progress & jobdesk hari ini staff ini (kalau ada di peta
        // staffProgress) supaya panel Proof Inspection tidak lagi selalu
        // menampilkan 0% / 0 jobdesk padahal staff-nya sudah kerja.
        const info = staffProgress[item.userId] || {};
        map.set(key, { key, userId: item.userId, name: item.userName, department: item.department, position: item.position, progress: info.progress || 0, jobs: info.jobs || [], report: info.report || null, uploads: [] });
      }
      map.get(key).uploads.push(item);
    }
    const list = [...map.values()];
    list.forEach((folder) => { folder.latestDate = folder.uploads.reduce((latest, item) => (!latest || (item.date || "") > latest ? item.date : latest), ""); });
    list.sort((a, b) => sortOrder === "desc" ? (b.latestDate || "").localeCompare(a.latestDate || "") : (a.latestDate || "").localeCompare(b.latestDate || ""));
    return list;
  }, [filtered, sortOrder]);

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
      <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Semua status</option><option value="PENDING">Menunggu Review</option><option value="APPROVED">Disetujui</option><option value="REJECTED">Ditolak</option></select>
      <select aria-label="Filter nama staff" className="select" value={staffId} onChange={(event) => setStaffId(event.target.value)}><option value="all">Semua Staff</option>{staffFilterOptions.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}</select>
      <label style={{ alignItems: "center", color: "var(--muted)", display: "flex", fontSize: 11, gap: 6 }}>Dari <input aria-label="Dari tanggal" className="field" type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label>
      <label style={{ alignItems: "center", color: "var(--muted)", display: "flex", fontSize: 11, gap: 6 }}>Sampai <input aria-label="Sampai tanggal" className="field" type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
      {(dateFrom || dateTo) && <button className="button button-ghost" onClick={() => { setDateFrom(""); setDateTo(""); }} type="button">Reset tanggal</button>}
      <span style={{ color: "var(--muted)", fontSize: 11, marginLeft: "auto" }}>{folders.length} staff · {filtered.length} berkas</span>
      <button className="button button-secondary" onClick={exportSummary}><Icon name="file" size={14} /> Export Summary Report</button>
    </div>
    {folders.length
      ? <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Staff</th><th>Jenis</th><th><button className="sort-header" onClick={() => setSortOrder((current) => current === "desc" ? "asc" : "desc")} type="button">Upload Terakhir <Icon name="arrow" size={12} className={sortOrder === "asc" ? "sort-icon sort-asc" : "sort-icon"} /></button></th><th>Jumlah Berkas</th><th>Aksi</th></tr></thead>
            <tbody>
              {folders.map((folder) => {
                const pendingCount = folder.uploads.filter((item) => item.approvalStatus === "PENDING").length;
                const typeLabels = [...new Set(folder.uploads.map((item) => item.typeLabel))];
                return <tr key={folder.key}>
                  <td><div className="person"><span className="avatar">{folder.name.slice(0, 2).toUpperCase()}</span><div className="person-copy"><strong>{folder.name}</strong><span>{folder.position} · {folder.department}</span></div></div></td>
                  <td>{typeLabels.join(", ")}</td>
                  <td>{folder.latestDate || "-"}</td>
                  <td><span className="upload-count"><Icon name="file" size={13} /> {folder.uploads.length} berkas{pendingCount ? ` · ${pendingCount} menunggu` : ""}</span></td>
                  <td><button className="review-button" onClick={() => setSelected(folder)}>Lihat Upload <Icon name="arrow" size={13} /></button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      : <div className="empty-state"><Icon name="upload" size={28} /><strong>Belum ada dokumen</strong><p>Upload staff akan muncul di sini untuk diperiksa.</p></div>}
    {selected && <ReviewDrawer person={{ name: selected.name, department: selected.department, position: selected.position, progress: selected.progress, jobs: selected.jobs, report: selected.report, uploads: selected.uploads, uploadCount: selected.uploads.length }} onClose={() => setSelected(null)} onReviewed={reviewed} />}
  </div>;
}
