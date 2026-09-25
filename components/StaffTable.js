"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/Icons";
import StaffCreateForm from "@/components/StaffCreateForm";
import { POSITION_OPTIONS } from "@/lib/positions";

// Staff lama belum punya `departmentIds` — dianggap cuma anggota divisi
// aktifnya sendiri (kalau ada) supaya filter & kolom tabel tetap benar.
function membershipOf(item) {
  return Array.isArray(item.departmentIds) && item.departmentIds.length
    ? item.departmentIds
    : (item.departmentId ? [item.departmentId] : []);
}

export default function StaffTable({ users, departments }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [active, setActive] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  // Salinan lokal supaya staff baru langsung muncul di tabel tanpa reload.
  const [list, setList] = useState(users);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  // "Hapus staff" = soft-delete (isActive: false), bukan dihapus permanen —
  // supaya histori jobdesk/report/upload staff itu tetap ada. Bisa
  // diaktifkan lagi kapan saja lewat tombol yang sama.
  async function toggleActive(staff) {
    const nextActive = staff.isActive === false;
    const confirmMessage = nextActive
      ? `Aktifkan kembali ${staff.name}?`
      : `Hapus (nonaktifkan) ${staff.name}? Staff ini tidak akan bisa login lagi, tapi histori jobdesk/report/upload-nya tetap tersimpan. Bisa diaktifkan lagi kapan saja.`;
    if (!window.confirm(confirmMessage)) return;
    setBusyId(staff.id);
    setError("");
    try {
      const response = await fetch(`/api/staff/${staff.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: nextActive }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Status staff gagal diperbarui.");
      setList((current) => current.map((item) => item.id === staff.id ? { ...item, isActive: nextActive } : item));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  const filtered = useMemo(() => list.filter((item) => {
    const haystack = `${item.name} ${item.email} ${item.position || ""} ${item.staffCode || ""}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) &&
      (department === "all" || membershipOf(item).includes(department)) &&
      (active === "all" || (active === "active" ? item.isActive !== false : item.isActive === false));
  }), [list, department, active, query]);

  function handleCreated(staff) {
    // Jangan tutup panel form di sini — popup kredensial staff baru hidup DI
    // DALAM StaffCreateForm, jadi kalau panel ini langsung ditutup, popup-nya
    // ikut hilang sebelum admin sempat baca/salin passwordnya. Form ditutup
    // manual oleh admin sendiri lewat tombol "Tutup".
    setList((current) => [{ ...staff }, ...current]);
  }

  return <section className="card section-card" style={{ marginTop: 18 }}>
    <div className="filter-bar">
      <label className="search-box table-search"><Icon name="search" size={15} /><input aria-label="Cari staff" placeholder="Cari nama, email, atau ID staff..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <select aria-label="Filter department" className="select" value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">Semua department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select aria-label="Filter status staff" className="select" value={active} onChange={(event) => setActive(event.target.value)}><option value="all">Semua status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      <span className="filter-result">{filtered.length} staff</span>
      <button className="button button-primary" onClick={() => setShowCreate((current) => !current)} style={{ marginLeft: "auto" }} type="button"><Icon name="plus" size={14} /> {showCreate ? "Tutup form" : "Tambah Staff"}</button>
    </div>
    {showCreate && <StaffCreateForm departments={departments} positionOptions={POSITION_OPTIONS} users={list} onCreated={handleCreated} onClose={() => setShowCreate(false)} />}
    {error && <div className="form-feedback error" role="alert" style={{ margin: "0 0 12px" }}><Icon name="info" size={15} />{error}</div>}
    {filtered.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Staff</th><th>ID Staff</th><th>Position</th><th>Department</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filtered.map((item) => {
      const memberIds = membershipOf(item);
      const memberNames = memberIds.map((id) => departments.find((departmentItem) => departmentItem.id === id)?.name).filter(Boolean);
      const isActive = item.isActive !== false;
      return <tr key={item.id}><td><div className="person"><span className="avatar">{item.name.slice(0, 2).toUpperCase()}</span><div className="person-copy"><strong>{item.name}</strong><span>{item.email}</span></div></div></td><td>{item.staffCode || "-"}</td><td>{item.position || "-"}</td><td>{memberNames.length ? (memberNames.length > 1 ? `${memberNames.join(", ")}` : memberNames[0]) : "-"}</td><td><span className="priority priority-LOW">{item.role}</span></td><td><span className={`status ${isActive ? "status-completed" : "status-not-started"}`}>{isActive ? "Active" : "Inactive"}</span></td><td style={{ display: "flex", gap: 10 }}><a className="text-link" href={`/staff/${item.id}`}>View</a><button className="text-link" disabled={busyId === item.id} onClick={() => toggleActive(item)} style={{ color: isActive ? "var(--red)" : "var(--green)" }} type="button">{busyId === item.id ? "..." : (isActive ? "Hapus" : "Aktifkan")}</button></td></tr>;
    })}</tbody></table></div> : <div className="empty-state"><Icon name="users" size={28} /><strong>Staff tidak ditemukan</strong><p>Sesuaikan kata kunci atau filter.</p></div>}
  </section>;
}
