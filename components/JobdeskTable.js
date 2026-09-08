"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/Icons";

function statusClass(status) {
  return status === "COMPLETED" ? "status-completed" : status === "ON_PROGRESS" ? "status-progress" : status === "PENDING" ? "status-pending" : "status-not-started";
}

function statusLabel(status) {
  return status === "COMPLETED" ? "Completed" : status === "ON_PROGRESS" ? "On Progress" : status === "PENDING" ? "Pending" : "Not Started";
}

export default function JobdeskTable({ allJobdesks, departments, kpis, initialSearch = "" }) {
  const [query, setQuery] = useState(initialSearch);
  const [department, setDepartment] = useState("all");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => allJobdesks.filter((item) => {
    const haystack = `${item.title} ${item.description || ""} ${item.user?.name || ""}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) &&
      (department === "all" || item.departmentId === department) &&
      (priority === "all" || item.priority === priority) &&
      (status === "all" || item.status === status);
  }), [allJobdesks, query, department, priority, status]);

  function reset() {
    setQuery("");
    setDepartment("all");
    setPriority("all");
    setStatus("all");
  }

  return <section className="card section-card">
    <div className="filter-bar">
      <label className="search-box table-search"><Icon name="search" size={15} /><input aria-label="Cari jobdesk" placeholder="Cari jobdesk, staff..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <select aria-label="Filter department" className="select" value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">Semua department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select aria-label="Filter priority" className="select" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">Semua priority</option><option value="URGENT">URGENT</option><option value="HIGH">HIGH</option><option value="MEDIUM">MEDIUM</option><option value="LOW">LOW</option></select>
      <select aria-label="Filter status" className="select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Semua status</option><option value="COMPLETED">Completed</option><option value="ON_PROGRESS">On Progress</option><option value="PENDING">Pending</option><option value="NOT_STARTED">Not Started</option></select>
      {(query || department !== "all" || priority !== "all" || status !== "all") && <button className="button button-ghost" onClick={reset} type="button">Reset</button>}
      <span className="filter-result">{filtered.length} jobdesk</span>
    </div>
    {filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Jobdesk</th><th>Staff</th><th>Department</th><th>Priority</th><th>KPI</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="table-title">{item.title}</div><div className="table-muted">{item.description || "Tidak ada deskripsi"}</div></td><td>{item.user?.name || "-"}</td><td>{item.department?.name || "-"}</td><td><span className={`priority priority-${item.priority}`}>{item.priority}</span></td><td>{kpis.filter((kpi) => kpi.jobdeskId === item.id).length}</td><td><span className={`status ${statusClass(item.status)}`}>{statusLabel(item.status)}</span></td><td><a className="text-link" href={`/jobdesk/${item.id}`}>Edit</a></td></tr>)}</tbody></table></div> : <div className="empty-state"><Icon name="briefcase" size={28} /><strong>Jobdesk tidak ditemukan</strong><p>Sesuaikan kata kunci atau reset filter.</p></div>}
  </section>;
}