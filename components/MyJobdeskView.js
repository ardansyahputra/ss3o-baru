"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/Icons";

export default function MyJobdeskView({ jobdesks, initialSearch = "" }) {
  const [query, setQuery] = useState(initialSearch);
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => jobdesks.filter((item) => {
    const haystack = `${item.title} ${item.description || ""}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) &&
      (priority === "all" || item.priority === priority) &&
      (status === "all" || item.status === status);
  }), [jobdesks, query, priority, status]);

  return <>
    <div className="page-filter-row">
      <div className="filter-bar"><label className="search-box table-search"><Icon name="search" size={15} /><input aria-label="Cari jobdesk saya" placeholder="Cari jobdesk..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Filter status jobdesk" className="select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Semua status</option><option value="NOT_STARTED">Belum mulai</option><option value="ON_PROGRESS">On Progress</option><option value="COMPLETED">Completed</option></select><select aria-label="Filter priority jobdesk" className="select" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">Semua priority</option><option value="URGENT">URGENT</option><option value="HIGH">HIGH</option><option value="MEDIUM">MEDIUM</option><option value="LOW">LOW</option></select><span className="filter-result">{filtered.length} dari {jobdesks.length} jobdesk</span></div>
    </div>
    {filtered.length ? <div className="jobdesk-grid">{filtered.map((item) => <article className="card jobdesk-card" key={item.id}><span className={`priority priority-${item.priority}`}>{item.priority}</span><h3>{item.title}</h3><p>{item.description || item.report?.notes || "Belum ada deskripsi tambahan untuk jobdesk ini."}</p><div className="card-meta"><span>Progress</span><strong>{item.progress}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${item.progress}%` }} /></div>{item.targetCount ? <p style={{ color: "var(--muted)", fontSize: 11, margin: "6px 0 0" }}>{item.approvedCount}/{item.targetCount} submit disetujui Admin (kumulatif)</p> : null}<div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginTop: 15 }}><span className={`status ${item.status === "COMPLETED" ? "status-completed" : item.status === "ON_PROGRESS" ? "status-progress" : "status-not-started"}`}>{item.status.replace("_", " ")}</span><a className="text-link" href={`/reports?jobdesk=${item.id}`}>Report <Icon name="arrow" size={13} /></a></div></article>)}</div> : <div className="card empty-state"><Icon name="briefcase" size={28} /><strong>Jobdesk tidak ditemukan</strong><p>Coba ubah kata kunci atau filter.</p></div>}
  </>;
}