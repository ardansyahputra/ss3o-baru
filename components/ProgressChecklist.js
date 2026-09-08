"use client";

import { useState } from "react";
import Icon from "@/components/Icons";

export default function ProgressChecklist({ jobdesks }) {
  const [items, setItems] = useState(jobdesks);
  const [saving, setSaving] = useState("");
  const completed = items.filter((item) => item.status === "COMPLETED" || item.progress === 100).length;

  async function toggle(item) {
    const nextCompleted = !(item.status === "COMPLETED" || item.progress === 100);
    setSaving(item.id);
    try {
      const response = await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobdeskId: item.id, completed: nextCompleted }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Progress gagal disimpan.");
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, progress: nextCompleted ? 100 : 0, status: nextCompleted ? "COMPLETED" : "NOT_STARTED" } : row));
    } catch (error) {
      window.alert(error.message);
    } finally {
      setSaving("");
    }
  }

  return <section className="card section-card"><div className="card-heading"><div><h2>Checklist pekerjaan hari ini</h2><p>Centang jobdesk yang sudah selesai agar progress tersimpan dan terlihat oleh Dika.</p></div><span className="status status-progress">{completed}/{items.length} selesai</span></div>{items.length ? <div className="checklist">{items.map((item) => { const isDone = item.status === "COMPLETED" || item.progress === 100; return <div className={`checklist-item ${isDone ? "done" : ""}`} key={item.id}><button className="check-box" aria-label={`${isDone ? "Batalkan" : "Tandai"} ${item.title}`} onClick={() => toggle(item)} disabled={saving === item.id}>{isDone ? <Icon name="check" size={14} /> : null}</button><div className="checklist-copy"><strong>{item.title}</strong><span>{item.department?.name || "Tanpa divisi"} · KPI: {item.kpis?.map((kpi) => kpi.description).join(", ") || "Progress tercatat di daily report"}</span></div><span className={`status ${isDone ? "status-completed" : item.status === "ON_PROGRESS" ? "status-progress" : "status-not-started"}`}>{isDone ? "Completed" : item.status === "ON_PROGRESS" ? "On Progress" : "Belum mulai"}</span></div>; })}</div> : <div className="empty-state"><Icon name="check" size={27} /><strong>Belum ada aktivitas</strong><p>Checklist akan terbentuk dari jobdesk aktif kamu.</p></div>}</section>;
}