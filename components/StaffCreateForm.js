"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";

export default function StaffCreateForm({ departments, positionOptions, users = [], onCreated, onClose }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [staffCode, setStaffCode] = useState("");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || "");
  const [position, setPosition] = useState(positionOptions[0] || "Staff");
  // templateStaffId = staff contoh yang jobdesk-nya mau disalin ke staff
  // baru ini (mis. pilih "Junan" supaya staff baru otomatis dapat jobdesk
  // yang sama seperti Junan, tanpa perlu diinput ulang satu-satu).
  const [templateStaffId, setTemplateStaffId] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });
  // credentials !== null artinya popup lagi terbuka. Backdrop-nya SENGAJA
  // tidak dikasih onClick supaya klik di luar popup tidak menutupnya —
  // admin cuma bisa tutup lewat tombol silang atau tombol konfirmasi.
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState("");

  // Daftar staff contoh difilter ke department yang sedang dipilih (dan
  // role STAFF biasa, bukan 2nd Leader/Store Leader) — supaya begitu admin
  // pilih department "Lastcall", pilihan contoh yang muncul otomatis staff
  // Lastcall juga (mis. Junan), bukan staff department lain.
  const templateOptions = useMemo(
    () => users.filter((item) => item.departmentId === departmentId && item.role === "STAFF" && item.isActive !== false),
    [users, departmentId]
  );

  useEffect(() => {
    setTemplateStaffId((current) => (templateOptions.some((item) => item.id === current) ? current : (templateOptions[0]?.id || "")));
  }, [templateOptions]);

  async function submit(event) {
    event.preventDefault();
    if (!name.trim() || !staffCode.trim()) { setState({ status: "error", message: "Nama dan ID staff wajib diisi." }); return; }
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), staffCode: staffCode.trim(), departmentId: departmentId || null, position, templateStaffId: templateStaffId || null })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setState({ status: "error", message: result.error || "Staff baru belum dapat disimpan." }); return; }
      setCredentials({ name: result.staff.name, email: result.staff.email, password: result.generatedPassword, clonedJobdeskCount: result.clonedJobdeskCount || 0, templateStaffName: result.templateStaffName });
      setState({ status: "idle", message: "" });
      onCreated?.(result.staff);
      setName("");
      setStaffCode("");
      router.refresh();
    } catch {
      setState({ status: "error", message: "Tidak dapat terhubung ke server. Coba lagi." });
    }
  }

  function closeCredentials() {
    setCredentials(null);
    setCopied("");
  }

  function copyValue(label, value) {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1500);
    }).catch(() => {});
  }

  return <>
    <form aria-label="Form tambah staff baru" className="password-form" style={{ marginBottom: 18 }} onSubmit={submit}>
      <div className="password-form-intro"><span className="security-badge"><Icon name="users" size={16} /></span><div><strong>Tambah staff baru</strong><p>Isi nama dan ID staff — akun login (email &amp; password) dibuatkan otomatis oleh sistem.</p></div></div>
      <div className="password-fields">
        <label className="form-group password-field" htmlFor="new-staff-name"><span className="form-label">Nama staff</span><input className="form-control" id="new-staff-name" placeholder="mis. Majid" required value={name} onChange={(event) => { setName(event.target.value); if (state.status !== "idle") setState({ status: "idle", message: "" }); }} /></label>
        <label className="form-group password-field" htmlFor="new-staff-code"><span className="form-label">ID Staff</span><input className="form-control" id="new-staff-code" placeholder="mis. STF-021" required value={staffCode} onChange={(event) => { setStaffCode(event.target.value); if (state.status !== "idle") setState({ status: "idle", message: "" }); }} /></label>
        <label className="form-group password-field" htmlFor="new-staff-department"><span className="form-label">Department</span><select className="select" id="new-staff-department" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="form-group password-field" htmlFor="new-staff-position"><span className="form-label">Posisi</span><select className="select" id="new-staff-position" value={position} onChange={(event) => setPosition(event.target.value)}>{positionOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="form-group password-field" htmlFor="new-staff-template">
          <span className="form-label">Samakan jobdesk seperti staff</span>
          <select className="select" id="new-staff-template" value={templateStaffId} onChange={(event) => setTemplateStaffId(event.target.value)} disabled={!templateOptions.length}>
            {templateOptions.length ? templateOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : <option value="">Belum ada staff lain di department ini</option>}
          </select>
        </label>
      </div>
      {templateStaffId && <p className="drawer-muted" style={{ margin: "-4px 0 0" }}>Jobdesk aktif milik staff yang dipilih akan otomatis disalin ke staff baru ini.</p>}
      {state.status === "error" && <div aria-live="polite" className="form-feedback error" role="alert"><Icon name="info" size={15} />{state.message}</div>}
      <div className="password-form-footer">
        <span>ID staff & jobdesk bisa diubah lagi kapan saja dari halaman detail staff.</span>
        <span style={{ display: "flex", gap: 9 }}>
          {onClose && <button className="button button-ghost" type="button" onClick={onClose}>Tutup</button>}
          <button className="button button-primary" disabled={state.status === "loading"} type="submit">{state.status === "loading" ? "Menyimpan..." : "Tambah staff"}<Icon name="arrow" size={15} /></button>
        </span>
      </div>
    </form>

    {credentials && (
      <div className="modal-backdrop" role="presentation">
        <div aria-labelledby="staff-credentials-title" aria-modal="true" className="modal-card" role="dialog">
          <div className="modal-head">
            <div><p className="eyebrow">Staff baru dibuat</p><h3 id="staff-credentials-title">Akun {credentials.name} siap dipakai</h3><p>Wajib dicatat sekarang — password tidak akan ditampilkan lagi setelah ini ditutup.</p></div>
            <button aria-label="Tutup popup" className="icon-button" onClick={closeCredentials} type="button"><Icon name="close" size={18} /></button>
          </div>
          <div className="modal-body">
            <p>Sampaikan detail login berikut ke <strong>{credentials.name}</strong> supaya bisa login pertama kali:</p>
            <div className="credential-box">
              <div className="credential-row"><span>Email</span><strong>{credentials.email}</strong><button onClick={() => copyValue("email", credentials.email)} type="button">{copied === "email" ? "Tersalin" : "Salin"}</button></div>
              <div className="credential-row"><span>Password</span><strong>{credentials.password}</strong><button onClick={() => copyValue("password", credentials.password)} type="button">{copied === "password" ? "Tersalin" : "Salin"}</button></div>
            </div>
            {credentials.clonedJobdeskCount > 0 && <div className="modal-note">{credentials.clonedJobdeskCount} jobdesk otomatis disalin dari {credentials.templateStaffName}.</div>}
            <small>Password ini hanya ditampilkan sekali. Sarankan staff menggantinya lewat menu Settings setelah login pertama.</small>
          </div>
          <div className="modal-foot"><button className="button button-primary" onClick={closeCredentials} type="button">Sudah dicatat, tutup</button></div>
        </div>
      </div>
    )}
  </>;
}
