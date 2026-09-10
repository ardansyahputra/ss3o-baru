"use client";

import { useState } from "react";
import Icon from "@/components/Icons";

export default function UploadView({ jobdesks = [], notices = [] }) {
  const [tab, setTab] = useState("work");
  const [files, setFiles] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [jobdeskId, setJobdeskId] = useState(jobdesks[0]?.id || "");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const tabs = [["work", "Hasil Kerja"], ["lxp", "LXP"], ["dsr", "DSR Staff"]];
  const label = tabs.find(([value]) => value === tab)?.[1];

  // Foto dari kamera HP biasanya beberapa MB per file — kalau kirim lebih
  // dari 1 foto sekaligus, total ukuran request gampang kena limit ukuran
  // server dan gagal (inilah error yang muncul di HP). Di sini foto
  // dikecilkan & dikompres dulu di browser SEBELUM dikirim, supaya beberapa
  // foto sekaligus tetap ringan dan tidak error saat diupload bareng.
  const MAX_DIMENSION = 1600; // px, sisi terpanjang
  const JPEG_QUALITY = 0.72;
  const COMPRESS_THRESHOLD = 1.2 * 1024 * 1024; // hanya kompres kalau > 1.2 MB

  function compressImage(file) {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/") || file.size <= COMPRESS_THRESHOLD) {
        resolve(file);
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) { height = Math.round((height * MAX_DIMENSION) / width); width = MAX_DIMENSION; }
        else if (height > MAX_DIMENSION) { width = Math.round((width * MAX_DIMENSION) / height); height = MAX_DIMENSION; }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob || blob.size >= file.size) { resolve(file); return; }
          const newName = file.name.replace(/\.(png|heic|heif|webp)$/i, ".jpg");
          resolve(new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() }));
        }, "image/jpeg", JPEG_QUALITY);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
      img.src = objectUrl;
    });
  }

  async function addFiles(event, source) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length) return;
    const processed = await Promise.all(selected.map((file) => compressImage(file)));
    setFiles((current) => [...current, ...processed.map((file) => ({ file, source }))]);
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
      // Kadang server bisa balas bukan JSON (mis. koneksi terputus di
      // tengah upload foto besar dari HP) — kalau langsung response.json()
      // tanpa dibungkus try/catch, staff akan lihat pesan mentah
      // "Unexpected end of JSON input" yang membingungkan. Di sini kalau
      // gagal di-parse, tampilkan pesan yang jelas sesuai status HTTP-nya.
      let result = {};
      try { result = await response.json(); } catch { result = {}; }
      if (!response.ok) throw new Error(result.error || `Upload gagal, coba lagi (status ${response.status}).`);
      setMessage(`${result.records?.length || files.length} file berhasil diupload.`);
      setFiles([]);
      setNotes("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  }

  return <>
    {notices.length > 0 && <div className="card section-card" style={{ marginBottom: 16 }}>
      <strong style={{ fontSize: 13 }}>Dari Admin</strong>
      <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
        {notices.map((item) => <div key={item.id} style={{ background: "#f6f8fa", borderRadius: 7, display: "grid", fontSize: 11.5, gap: 3, padding: "9px 10px" }}>
          <span style={{ color: "var(--muted)" }}>{item.adminName || "Admin"} · {(item.createdAt || "").slice(0, 10)}</span>
          {item.notes && <span style={{ whiteSpace: "pre-wrap" }}>{item.notes}</span>}
          {item.filePath && <a className="text-link" download href={item.filePath}>{item.fileName || "Lihat file"}</a>}
        </div>)}
      </div>
    </div>}
    <div className="card section-card">
    <div className="tab-bar">{tabs.map(([value, text]) => <button className={`tab ${tab === value ? "active" : ""}`} key={value} onClick={() => { setTab(value); setFiles([]); setMessage(""); }}>{text}</button>)}</div>
    <div className="form-grid" style={{ maxWidth: 900 }}>
      <div className="form-group"><label className="form-label">Tanggal</label><input className="field form-control" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
      {tab === "work" && <div className="form-group"><label className="form-label">Jenis pekerjaan (jobdesk)</label><select className="select form-control" value={jobdeskId} onChange={(event) => setJobdeskId(event.target.value)}><option value="">Pilih jobdesk</option>{jobdesks.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>}
      <div className="form-group full">
        <label className="form-label">Bukti {label}</label>
        <div className="upload-source-grid">
          <label className="upload-zone upload-camera-zone"><Icon name="camera" size={29} /><strong>Ambil dari kamera</strong><span>Foto langsung dari kamera · bisa beberapa foto</span><input hidden type="file" accept="image/*" capture="environment" multiple onChange={(event) => addFiles(event, "Kamera")} /></label>
          <label className="upload-zone"><Icon name="upload" size={29} /><strong>Pilih dari perangkat</strong><span>JPG, PNG, PDF, XLSX, DOCX · bisa banyak file</span><input hidden type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx,.doc,.docx" onChange={(event) => addFiles(event, "Perangkat")} /></label>
        </div>
        {files.length > 0 && <div className="selected-files"><strong>{files.length} file siap diupload</strong>{files.map(({ file, source }, index) => <span key={`${file.name}-${index}`}><Icon name={file.type.startsWith("image/") ? "image" : "file"} size={13} /> {file.name} · {source}<button type="button" aria-label={`Hapus ${file.name}`} onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></span>)}</div>}
      </div>
      <div className="form-group full">
        <label className="form-label">Catatan / keterangan pekerjaan</label>
        <textarea className="field form-control textarea" rows="4" placeholder={`Tuliskan keterangan ${label}. Tekan Enter untuk baris baru, misalnya membuat daftar per poin.`} value={notes} onChange={(event) => setNotes(event.target.value)} />
        <span className="field-hint">Tekan Enter untuk pindah baris — cocok untuk menulis beberapa poin pekerjaan sekaligus.</span>
      </div>
    </div>
    <div style={{ alignItems: "center", display: "flex", justifyContent: "flex-end", marginTop: 20 }}>{message && <span style={{ color: message.includes("berhasil") ? "var(--green)" : "var(--red)", fontSize: 12, marginRight: "auto" }}>{message}</span>}<button className="button button-primary" disabled={uploading} onClick={upload}>{uploading ? "Mengupload..." : `Upload ${files.length || ""} ${label}`.trim()} <Icon name="arrow" size={14} /></button></div>
  </div></>;
}