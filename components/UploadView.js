"use client";

import { useState } from "react";
import Icon from "@/components/Icons";

export default function UploadView({ jobdesks = [] }) {
  const [tab, setTab] = useState("work");
  const [files, setFiles] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [jobdeskId, setJobdeskId] = useState(jobdesks[0]?.id || "");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const tabs = [["work", "Hasil Kerja"], ["lxp", "LXP"], ["dsr", "DSR Staff"]];
  const label = tabs.find(([value]) => value === tab)?.[1];

  function addFiles(event, source) {
    const selected = Array.from(event.target.files || []);
    if (selected.length) setFiles((current) => [...current, ...selected.map((file) => ({ file, source }))]);
    event.target.value = "";
  }

  async function upload() {
    if (!files.length) { setMessage("Pilih minimal satu file terlebih dahulu."); return; }
    setUploading(true);
    setMessage("");
    try {
      const body = new FormData();
      files.forEach(({ file, source }) => { body.append("file", file); body.append("source", source); });
      body.append("type", tab);
      body.append("date", date);
      body.append("notes", notes);
      if (jobdeskId) body.append("jobdeskId", jobdeskId);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload gagal.");
      setMessage(`${result.records?.length || files.length} file berhasil diupload.`);
      setFiles([]);
      setNotes("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  }

  return <div className="card section-card">
    <div className="tab-bar">{tabs.map(([value, text]) => <button className={`tab ${tab === value ? "active" : ""}`} key={value} onClick={() => { setTab(value); setFiles([]); setMessage(""); }}>{text}</button>)}</div>
    <div className="form-grid" style={{ maxWidth: 900 }}>
      <div className="form-group"><label className="form-label">Tanggal</label><input className="field form-control" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
      {tab === "work" && <div className="form-group"><label className="form-label">Jobdesk terkait</label><select className="select form-control" value={jobdeskId} onChange={(event) => setJobdeskId(event.target.value)}><option value="">Pilih jobdesk</option>{jobdesks.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>}
      <div className="form-group"><label className="form-label">Keterangan</label><input className="field form-control" placeholder={`Keterangan ${label}`} value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
      <div className="form-group full"><label className="form-label">Bukti {label}</label><div className="upload-source-grid">
        <label className="upload-zone upload-camera-zone"><Icon name="camera" size={29} /><strong>Ambil dari kamera</strong><span>Foto langsung dari kamera · bisa beberapa foto</span><input hidden type="file" accept="image/*" capture="environment" multiple onChange={(event) => addFiles(event, "Kamera")} /></label>
        <label className="upload-zone"><Icon name="upload" size={29} /><strong>Pilih dari perangkat</strong><span>JPG, PNG, PDF, XLSX, DOCX · bisa banyak file</span><input hidden type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx,.doc,.docx" onChange={(event) => addFiles(event, "Perangkat")} /></label>
      </div></div>
    </div>
    {files.length > 0 && <div className="selected-files"><strong>{files.length} file siap diupload</strong>{files.map(({ file, source }, index) => <span key={`${file.name}-${index}`}><Icon name={file.type.startsWith("image/") ? "image" : "file"} size={13} /> {file.name} · {source}<button type="button" aria-label={`Hapus ${file.name}`} onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></span>)}</div>}
    <div style={{ alignItems: "center", display: "flex", justifyContent: "flex-end", marginTop: 20 }}>{message && <span style={{ color: message.includes("berhasil") ? "var(--green)" : "var(--red)", fontSize: 12, marginRight: "auto" }}>{message}</span>}<button className="button button-primary" disabled={uploading} onClick={upload}>{uploading ? "Mengupload..." : `Upload ${files.length || ""} ${label}`.trim()} <Icon name="arrow" size={14} /></button></div>
  </div>;
}