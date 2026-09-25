"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";
import { roleLabel, departmentMembership } from "@/lib/roles";

export default function JobdeskForm({ departments, users, existingJobdesks = [] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    departmentId: departments[0]?.id || "",
    userId: "",
    priority: "MEDIUM",
    description: "",
    targetCount: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const staffOptions = useMemo(
    () => users.filter((item) => !form.departmentId || departmentMembership(item).includes(form.departmentId)),
    [users, form.departmentId]
  );

  // Judul jobdesk yang sudah pernah dipakai di divisi yang lagi dipilih —
  // ditawarkan lewat <datalist> supaya admin tinggal PILIH judul yang sudah
  // ada (mis. "Report Malam") daripada ketik ulang manual tiap kali bikin
  // jobdesk baru untuk staff lain di divisi yang sama. Tetap bisa ketik
  // judul baru bebas kalau memang belum ada di daftar.
  const titleSuggestions = useMemo(() => {
    if (!form.departmentId) return [];
    const seen = new Set();
    const list = [];
    for (const item of existingJobdesks) {
      if (item.departmentId !== form.departmentId) continue;
      const title = (item.title || "").trim();
      const key = title.toLowerCase();
      if (!title || seen.has(key)) continue;
      seen.add(key);
      list.push(title);
    }
    return list.sort((a, b) => a.localeCompare(b));
  }, [existingJobdesks, form.departmentId]);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateDepartment(departmentId) {
    setForm((current) => {
      const stillValid = users.some((item) => item.id === current.userId && departmentMembership(item).includes(departmentId));
      return { ...current, departmentId, userId: stillValid ? current.userId : "" };
    });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/jobdesks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Jobdesk gagal disimpan.");
      router.push("/jobdesk");
      router.refresh();
    } catch (error) {
      setMessage(error.message);
      setSaving(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={submit}>
      <div className="form-grid">
        <div className="form-group full">
          <label className="form-label">Nama jobdesk</label>
          <input className="field form-control" list="jobdesk-title-suggestions" placeholder="Contoh: Report Malam / Closing Kasir" value={form.title} onChange={(event) => update("title", event.target.value)} required />
          <datalist id="jobdesk-title-suggestions">{titleSuggestions.map((title) => <option key={title} value={title} />)}</datalist>
          {form.departmentId && titleSuggestions.length > 0 && <small style={{ color: "var(--muted)" }}>Ketik untuk lihat {titleSuggestions.length} jobdesk yang sudah ada di divisi ini, atau ketik judul baru.</small>}
        </div>
        <div className="form-group">
          <label className="form-label">Divisi / Departemen</label>
          <select className="select form-control" value={form.departmentId} onChange={(event) => updateDepartment(event.target.value)} required>
            <option value="">Pilih departemen</option>
            {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Staff penanggung jawab</label>
          <select className="select form-control" value={form.userId} onChange={(event) => update("userId", event.target.value)} required>
            <option value="">Pilih staff</option>
            {form.departmentId && staffOptions.length > 0 && <option value="ALL">👥 Semua Staff ({staffOptions.length} orang)</option>}
            {staffOptions.map((item) => <option key={item.id} value={item.id}>{item.name}{item.position ? ` — ${item.position}` : ""} ({roleLabel(item.role)})</option>)}
          </select>
          {form.departmentId && !staffOptions.length && <small style={{ color: "var(--red)" }}>Belum ada staff aktif di departemen ini.</small>}
          {form.userId === "ALL" && <small style={{ color: "var(--muted)" }}>Jobdesk ini akan dibuat untuk setiap staff aktif di departemen terpilih, masing-masing dengan progress sendiri.</small>}
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="select form-control" value={form.priority} onChange={(event) => update("priority", event.target.value)}>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Target jumlah submit (opsional)</label>
          <input className="field form-control" type="number" min="1" placeholder="Kosongkan jika pakai slider/checklist manual" value={form.targetCount} onChange={(event) => update("targetCount", event.target.value)} />
          <small style={{ color: "var(--muted)" }}>Kalau diisi (misal 200), progress dihitung otomatis dari jumlah report yang di-approve, kumulatif.</small>
        </div>
        <div className="form-group full">
          <label className="form-label">Detail jobdesk</label>
          <textarea className="field form-control textarea" rows="4" placeholder="Jelaskan cakupan pekerjaan ini, misal: Report Malam mencakup closing kasir, cek CCTV, rekap penjualan harian, dan serah terima shift." value={form.description} onChange={(event) => update("description", event.target.value)} />
          <small style={{ color: "var(--muted)" }}>Detail ini akan tampil ke staff sebagai acuan apa saja yang perlu dikerjakan/dilaporkan.</small>
        </div>
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 21 }}>
        {message && <span style={{ color: "var(--red)", fontSize: 12, marginRight: "auto" }}>{message}</span>}
        <button className="button button-primary" disabled={saving} type="submit">{saving ? "Menyimpan..." : "Simpan Jobdesk"} <Icon name="arrow" size={14} /></button>
      </div>
    </form>
  );
}
