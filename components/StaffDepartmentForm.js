"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";

// Form multi-divisi + switch divisi untuk satu staff. Dua hal digabung jadi
// satu form supaya alurnya jelas buat admin: pertama tentukan staff ini
// ditugaskan di divisi mana saja (bisa lebih dari satu, klik chip untuk
// centang/uncentang), baru kemudian pilih satu di antaranya yang jadi
// "divisi aktif" — divisi aktif inilah yang dipakai di seluruh bagian lain
// sistem (dashboard, filter jobdesk per divisi, monitoring, dsb).
export default function StaffDepartmentForm({ staffId, departments, currentDepartmentIds, currentDepartmentId }) {
  const router = useRouter();
  const [memberIds, setMemberIds] = useState(currentDepartmentIds || []);
  const [activeId, setActiveId] = useState(currentDepartmentId || "");
  const [savedMemberIds, setSavedMemberIds] = useState(currentDepartmentIds || []);
  const [savedActiveId, setSavedActiveId] = useState(currentDepartmentId || "");
  const [state, setState] = useState({ status: "idle", message: "" });

  const activeOptions = useMemo(
    () => departments.filter((item) => memberIds.includes(item.id)),
    [departments, memberIds]
  );

  function toggleMember(id) {
    setState({ status: "idle", message: "" });
    setMemberIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      // Kalau divisi aktif yang lagi dipilih ternyata baru saja di-uncheck,
      // otomatis pindah ke divisi lain yang masih tercentang (atau kosong
      // kalau tidak ada tersisa) — supaya divisi aktif tidak pernah nyasar
      // ke divisi yang sudah bukan keanggotaan staff ini lagi.
      setActiveId((currentActive) => (next.includes(currentActive) ? currentActive : (next[0] || "")));
      return next;
    });
  }

  const isDirty = memberIds.length !== savedMemberIds.length
    || memberIds.some((id) => !savedMemberIds.includes(id))
    || activeId !== savedActiveId;

  async function submit(event) {
    event.preventDefault();
    if (!isDirty) return;
    setState({ status: "loading", message: "" });
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentIds: memberIds, departmentId: activeId || null })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState({ status: "error", message: result.error || "Divisi belum dapat diubah." });
        return;
      }
      const finalActive = result.departmentId ?? activeId;
      setSavedMemberIds(memberIds);
      setSavedActiveId(finalActive);
      setActiveId(finalActive || "");
      const autoNote = result.autoAssignedJobdeskCount
        ? ` ${result.autoAssignedJobdeskCount} jobdesk otomatis ditambahkan dari divisi ${result.autoAssignedDepartmentNames.join(" & ")}.`
        : "";
      const removedNote = result.removedJobdeskCount
        ? ` ${result.removedJobdeskCount} jobdesk lama dari divisi ${result.removedDepartmentNames.join(" & ")} sudah dinonaktifkan.`
        : "";
      setState({ status: "success", message: `Divisi staff berhasil diperbarui.${autoNote}${removedNote}` });
      router.refresh();
    } catch {
      setState({ status: "error", message: "Tidak dapat terhubung ke server. Coba lagi." });
    }
  }

  return <form className="password-form" style={{ marginTop: 10 }} onSubmit={submit}>
    <div className="form-group">
      <span className="form-label">Divisi (boleh pilih lebih dari satu)</span>
      <div className="division-picker">
        {departments.length
          ? departments.map((item) => {
              const checked = memberIds.includes(item.id);
              return <button
                aria-pressed={checked}
                className={`division-chip${checked ? " selected" : ""}`}
                key={item.id}
                onClick={() => toggleMember(item.id)}
                type="button"
              >
                <Icon name={checked ? "check" : "building"} size={13} />
                {item.name}
              </button>;
            })
          : <span className="drawer-muted">Belum ada divisi terdaftar.</span>}
      </div>
    </div>

    <div className="password-fields" style={{ alignItems: "flex-end", marginTop: 14 }}>
      <label className="form-group password-field" htmlFor="staff-active-department" style={{ flex: 1 }}>
        <span className="form-label">Divisi aktif (switch divisi)</span>
        <select
          className="select"
          disabled={!activeOptions.length}
          id="staff-active-department"
          onChange={(event) => { setActiveId(event.target.value); setState({ status: "idle", message: "" }); }}
          value={activeId}
        >
          {activeOptions.length
            ? activeOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)
            : <option value="">Pilih minimal satu divisi dulu</option>}
        </select>
      </label>
      <button className="button button-primary" disabled={state.status === "loading" || !isDirty} type="submit">{state.status === "loading" ? "Menyimpan..." : "Simpan divisi"}<Icon name="arrow" size={15} /></button>
    </div>
    <p className="drawer-muted" style={{ margin: "8px 0 0" }}>Divisi aktif menentukan divisi mana yang dipakai staff ini di dashboard, filter jobdesk, dan monitoring.</p>
    {state.status === "error" && <div aria-live="polite" className="form-feedback error" role="alert" style={{ marginTop: 8 }}><Icon name="info" size={15} />{state.message}</div>}
    {state.status === "success" && <div aria-live="polite" className="form-feedback success" role="status" style={{ marginTop: 8 }}><Icon name="check" size={15} />{state.message}</div>}
  </form>;
}
