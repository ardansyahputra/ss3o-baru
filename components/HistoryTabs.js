"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/Icons";
import ImagePreview from "@/components/ImagePreview";

const tabOptions = [
  ["reports", "Reports"],
  ["work", "Work Upload"],
  ["lxp", "LXP"],
  ["dsr", "DSR"],
];

function reportStatusClass(status) {
  return status === "COMPLETED" ? "status-completed" : status === "ON_PROGRESS" ? "status-progress" : "status-pending";
}

function reportStatusLabel(status) {
  return status === "COMPLETED" ? "Completed" : status === "ON_PROGRESS" ? "On Progress" : "Pending";
}

function uploadStatusClass(status) {
  return status === "APPROVED" ? "status-completed" : status === "REVISION" || status === "REJECTED" ? "status-revision" : "status-pending";
}

function uploadStatusLabel(status) {
  return status === "APPROVED" ? "Disetujui" : status === "REVISION" ? "Perlu Revisi" : status === "REJECTED" ? "Ditolak" : "Menunggu Review";
}

export default function HistoryTabs({ reports, uploads, users, jobdesks }) {
  const [tab, setTab] = useState("reports");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("all");

  const currentUploads = useMemo(() => uploads.filter((item) => item.type === tab), [uploads, tab]);
  const filteredReports = useMemo(() => reports.filter((report) => {
    const jobdesk = jobdesks.find((item) => item.id === report.jobdeskId);
    const staff = users.find((item) => item.id === report.userId);
    const haystack = `${jobdesk?.title || ""} ${staff?.name || ""} ${report.report || ""}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (!date || report.date === date) && (status === "all" || report.status === status);
  }), [reports, jobdesks, users, query, date, status]);
  const filteredUploads = useMemo(() => currentUploads.filter((upload) => {
    const haystack = `${upload.fileName || ""} ${upload.jobdeskTitle || ""} ${upload.userName || ""}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (!date || upload.date === date) && (status === "all" || upload.approvalStatus === status);
  }), [currentUploads, query, date, status]);

  function changeTab(nextTab) {
    setTab(nextTab);
    setQuery("");
    setDate("");
    setStatus("all");
  }

  return (
    <div className="card section-card">
      <div aria-label="Jenis history" className="tab-bar" role="tablist">
        {tabOptions.map(([value, label]) => {
          const count = value === "reports" ? reports.length : uploads.filter((item) => item.type === value).length;
          return <button aria-selected={tab === value} className={`tab ${tab === value ? "active" : ""}`} key={value} onClick={() => changeTab(value)} role="tab" type="button">{label} <span style={{ color: "var(--muted)", fontWeight: 500 }}>({count})</span></button>;
        })}
      </div>
      <div className="filter-bar">
        <label className="search-box history-search"><Icon name="search" size={15} /><input aria-label="Cari history" placeholder={tab === "reports" ? "Cari report, jobdesk, staff..." : "Cari file, jobdesk, staff..."} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <input aria-label="Filter tanggal" className="field" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <select aria-label="Filter status" className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Semua status</option>
          {tab === "reports" ? <><option value="COMPLETED">Completed</option><option value="ON_PROGRESS">On Progress</option><option value="PENDING">Pending</option></> : <><option value="PENDING">Menunggu Review</option><option value="APPROVED">Disetujui</option><option value="REVISION">Perlu Revisi</option><option value="REJECTED">Ditolak</option></>}
        </select>
        {(query || date || status !== "all") && <button className="button button-ghost" onClick={() => { setQuery(""); setDate(""); setStatus("all"); }} type="button">Reset filter</button>}
      </div>

      {tab === "reports" ? filteredReports.length ? (
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Tanggal</th><th>Jobdesk</th><th>Staff</th><th>Progress</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
          {filteredReports.map((report) => <tr key={report.id}><td>{report.date || "-"}</td><td><div className="table-title">{jobdesks.find((item) => item.id === report.jobdeskId)?.title || "Jobdesk"}</div><div className="table-muted">{(report.report || "").slice(0, 58)}{(report.report || "").length > 58 ? "..." : ""}</div></td><td>{users.find((item) => item.id === report.userId)?.name || "-"}</td><td><div className="mini-progress"><div className="progress-track"><div className="progress-fill" style={{ width: `${report.progress || 0}%` }} /></div><span>{report.progress || 0}%</span></div></td><td><span className={`status ${reportStatusClass(report.status)}`}>{reportStatusLabel(report.status)}</span></td><td><a className="text-link" href={`/reports/${report.id}`}>View</a></td></tr>)}
        </tbody></table></div>
      ) : <div className="empty-state"><Icon name="history" size={28} /><strong>Belum ada history report</strong><p>Belum ada report yang cocok dengan filter.</p></div> : filteredUploads.length ? (
        <div className="table-wrap"><table className="data-table"><thead><tr><th>File</th><th>Jenis</th><th>Sumber</th><th>Jobdesk</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
          {filteredUploads.map((upload) => <tr key={`${upload.type}-${upload.id}`}><td><div className="table-title-row"><span className="table-title">{upload.fileName}</span>{upload.mimeType?.startsWith("image/") && upload.filePath && <ImagePreview src={upload.filePath} label={upload.fileName} caption={`${upload.typeLabel} · ${upload.jobdeskTitle || "Tanpa jobdesk"}`} />}</div><div className="table-muted">{Math.ceil((upload.size || 0) / 1024)} KB</div></td><td>{upload.typeLabel}</td><td><span className="status status-progress">{upload.source || "Perangkat"}</span></td><td>{upload.jobdeskTitle || "-"}</td><td>{upload.date || "-"}</td><td><span className={`status ${uploadStatusClass(upload.approvalStatus)}`}>{uploadStatusLabel(upload.approvalStatus)}</span>{upload.approvalStatus === "REJECTED" && upload.reviewNotes && <div className="table-muted" style={{ marginTop: 4, maxWidth: 160 }}>{upload.reviewNotes}</div>}</td><td>{upload.filePath ? <a className="text-link" download href={upload.filePath}>Unduh</a> : "-"}</td></tr>)}
        </tbody></table></div>
      ) : <div className="empty-state"><Icon name="upload" size={28} /><strong>Belum ada bukti upload</strong><p>Belum ada file yang cocok dengan filter.</p></div>}
    </div>
  );
}