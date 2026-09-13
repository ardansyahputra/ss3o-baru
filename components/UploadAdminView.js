"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/Icons";
import ReviewDrawer from "@/components/ReviewDrawer";

// Ambil gambar dari URL (Vercel Blob) lalu ubah jadi data URL base64 supaya
// bisa ditempel ke PDF (jsPDF butuh base64/Image, bukan URL langsung).
async function toDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Gagal mengambil gambar");
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function UploadAdminView({ uploads, staffProgress = {} }) {
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  // Filter tanggal sekarang berupa RENTANG (dari - sampai), bukan tanggal
  // tunggal, supaya bisa lihat mis. 1–5 September sekaligus.
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // Filter nama staff — defaultnya "Semua Staff".
  const [staffFilter, setStaffFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  // "desc" = upload terbaru dulu, "asc" = upload terlama dulu.
  const [sortOrder, setSortOrder] = useState("desc");
  const [exportingPdf, setExportingPdf] = useState(false);
  // Salinan lokal dari uploads supaya status approve/revisi/reject bisa
  // langsung ter-update di daftar folder tanpa perlu reload halaman.
  const [items, setItems] = useState(uploads);

  const staffOptions = useMemo(() => {
    const map = new Map();
    items.forEach((item) => { if (item.userId) map.set(item.userId, item.userName); });
    return [...map.entries()].sort((a, b) => (a[1] || "").localeCompare(b[1] || ""));
  }, [items]);

  const filtered = useMemo(() => items.filter((item) =>
    (type === "all" || item.type === type) &&
    (status === "all" || item.approvalStatus === status) &&
    (!dateFrom || (item.date && item.date >= dateFrom)) &&
    (!dateTo || (item.date && item.date <= dateTo)) &&
    (staffFilter === "all" || item.userId === staffFilter)
  ), [items, type, status, dateFrom, dateTo, staffFilter]);

  const hasActiveFilters = type !== "all" || status !== "all" || dateFrom || dateTo || staffFilter !== "all";

  function resetFilters() {
    setType("all");
    setStatus("all");
    setDateFrom("");
    setDateTo("");
    setStaffFilter("all");
  }

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

  // Export PDF — mengikuti filter yang sedang aktif (jenis, status, rentang
  // tanggal, staff) dan menyertakan thumbnail gambar bukti upload.
  async function exportPdf() {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const thumbSize = 78;
      let y = margin;

      doc.setFontSize(15);
      doc.setTextColor(20);
      doc.text("SS3O — Laporan Bukti Upload", margin, y);
      y += 18;

      doc.setFontSize(9.5);
      doc.setTextColor(110);
      const staffLabel = staffFilter === "all" ? "Semua Staff" : (staffOptions.find(([id]) => id === staffFilter)?.[1] || "-");
      const rangeLabel = dateFrom || dateTo ? `${dateFrom || "awal"} s/d ${dateTo || "sekarang"}` : "Semua tanggal";
      doc.text(`Jenis: ${type === "all" ? "Semua jenis" : type} · Status: ${status === "all" ? "Semua status" : status}`, margin, y);
      y += 13;
      doc.text(`Staff: ${staffLabel} · Tanggal: ${rangeLabel}`, margin, y);
      y += 13;
      doc.text(`Total: ${filtered.length} berkas`, margin, y);
      y += 18;
      doc.setDrawColor(220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 14;
      doc.setTextColor(0);

      for (const item of filtered) {
        const textX = margin + thumbSize + 10;
        const textWidth = pageWidth - margin - textX;
        // Catatan/ulasan yang staff tulis saat upload (item.notes) — kalau
        // ada, dipecah jadi beberapa baris supaya baris tabelnya melar
        // otomatis mengikuti panjang catatan, bukan terpotong.
        const noteLines = item.notes ? doc.splitTextToSize(`Catatan: ${item.notes}`, textWidth) : [];
        const rowHeight = Math.max(thumbSize, 40 + noteLines.length * 10) + 12;
        if (y + rowHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        let imgAdded = false;
        if (item.filePath && item.mimeType?.startsWith("image/")) {
          try {
            const dataUrl = await toDataUrl(item.filePath);
            const format = /data:image\/(png)/i.test(dataUrl) ? "PNG" : "JPEG";
            doc.addImage(dataUrl, format, margin, y, thumbSize, thumbSize);
            imgAdded = true;
          } catch {
            // Kalau gambar gagal diambil (mis. bukan gambar / CORS), lanjut
            // tanpa thumbnail — jangan gagalkan seluruh export.
          }
        }
        if (!imgAdded) {
          doc.setDrawColor(225);
          doc.rect(margin, y, thumbSize, thumbSize);
          doc.setFontSize(7.5);
          doc.setTextColor(160);
          doc.text(item.mimeType?.startsWith("image/") ? "Gagal muat" : "Non-gambar", margin + 6, y + thumbSize / 2, { maxWidth: thumbSize - 12 });
          doc.setTextColor(0);
        }
        doc.setFontSize(10);
        doc.text(item.fileName || "-", textX, y + 12, { maxWidth: textWidth });
        doc.setFontSize(8.5);
        doc.setTextColor(100);
        doc.text(`${item.userName || "-"} · ${item.typeLabel || "-"} · ${item.jobdeskTitle || "Tanpa jobdesk"}`, textX, y + 27, { maxWidth: textWidth });
        doc.text(`${item.date || "-"} · ${item.approvalStatus || "PENDING"}`, textX, y + 40, { maxWidth: textWidth });
        if (noteLines.length) {
          doc.setFontSize(8);
          doc.setTextColor(70);
          doc.text(noteLines, textX, y + 53);
        }
        doc.setTextColor(0);
        y += rowHeight;
      }

      // Kalau lagi difilter per-staff, nama file PDF ikut berganti sesuai
      // nama staff yang difilter (mis. "ss3o-bukti-upload-tito-...pdf")
      // supaya begitu di-download, filenya langsung jelas punya siapa —
      // tidak perlu buka dulu untuk tahu isinya punya siapa.
      const slugifyFileName = (text) => String(text || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "staff";
      const staffSuffix = staffFilter !== "all" ? `-${slugifyFileName(staffLabel)}` : "";
      const fileSuffix = dateFrom || dateTo ? `-${dateFrom || "awal"}_${dateTo || "now"}` : "";
      doc.save(`ss3o-bukti-upload${staffSuffix}${fileSuffix}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  }

  function reviewed(change) {
    setItems((current) => current.map((item) => item.id === change.targetId ? { ...item, approvalStatus: change.action } : item));
    setSelected((current) => current ? { ...current, uploads: current.uploads.map((upload) => upload.id === change.targetId ? { ...upload, approvalStatus: change.action } : upload) } : current);
  }

  return <div className="card section-card">
    <div className="filter-bar">
      <select className="select" value={type} onChange={(event) => setType(event.target.value)}><option value="all">Semua jenis upload</option><option value="work">Hasil Kerja</option><option value="lxp">LXP</option><option value="dsr">DSR Staff</option></select>
      <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Semua status</option><option value="PENDING">Menunggu Review</option><option value="APPROVED">Disetujui</option><option value="REJECTED">Ditolak</option></select>
      <select aria-label="Filter staff" className="select" value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)}><option value="all">Semua Staff</option>{staffOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <label className="field-inline" style={{ alignItems: "center", display: "flex", gap: 6 }}>
        <span style={{ color: "var(--muted)", fontSize: 11 }}>Dari</span>
        <input aria-label="Filter tanggal dari" className="field" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
      </label>
      <label className="field-inline" style={{ alignItems: "center", display: "flex", gap: 6 }}>
        <span style={{ color: "var(--muted)", fontSize: 11 }}>Sampai</span>
        <input aria-label="Filter tanggal sampai" className="field" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
      </label>
      {hasActiveFilters && <button className="button button-ghost" onClick={resetFilters} type="button">Reset</button>}
      <span style={{ color: "var(--muted)", fontSize: 11, marginLeft: "auto" }}>{folders.length} staff · {filtered.length} berkas</span>
      <button className="button button-secondary" onClick={exportSummary} type="button"><Icon name="file" size={14} /> Export CSV</button>
      <button className="button button-primary" disabled={exportingPdf || !filtered.length} onClick={exportPdf} type="button"><Icon name="file" size={14} /> {exportingPdf ? "Membuat PDF..." : "Export PDF"}</button>
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
