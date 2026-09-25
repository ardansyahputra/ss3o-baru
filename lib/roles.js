// Sistem role SS3O: STAFF (biasa), LEADER ("2nd Leader" — akses admin tapi
// bukan Administrator utama), ADMIN (Administrator penuh).
// LEADER dan ADMIN sama-sama dianggap "admin-like" untuk urusan akses menu
// Administration (Staff, Divisi, Monitoring, Kelola Bukti Upload, dsb).
export const ROLES = { STAFF: "STAFF", LEADER: "LEADER", ADMIN: "ADMIN" };

export function isAdminRole(role) {
  return role === ROLES.ADMIN || role === ROLES.LEADER;
}

export function roleLabel(role) {
  if (role === ROLES.ADMIN) return "Administrator";
  if (role === ROLES.LEADER) return "2nd Leader";
  return "Staff";
}

// Divisi mana saja staf ini jadi anggota (multi-divisi). Staff lama yang
// belum punya field `departmentIds` (dibuat sebelum fitur multi-divisi ada)
// dianggap cuma anggota divisi aktifnya sendiri (`departmentId`), supaya
// data lama tetap kebaca benar tanpa perlu migrasi manual.
export function departmentMembership(user) {
  return Array.isArray(user?.departmentIds) && user.departmentIds.length
    ? user.departmentIds
    : (user?.departmentId ? [user.departmentId] : []);
}

// Menentukan divisi mana saja yang boleh dipantau seorang LEADER lewat menu
// Monitoring. Defaultnya cuma divisi dia sendiri (mis. Aldo -> Lastcall,
// Ilham -> Reguler). Tapi kalau user punya `monitoringDepartmentIds` sendiri
// di data (mis. Rizki yang pegang Online DAN Kasir), dipakai daftar itu,
// dan menu Monitoring-nya jadi gabungan nama divisinya (mis. "Online & Kasir")
// — tetap cuma satu menu di sidebar, bukan satu menu per divisi.
export function resolveMonitoringScope(user, departmentsById = {}) {
  const ids = Array.isArray(user?.monitoringDepartmentIds) && user.monitoringDepartmentIds.length
    ? user.monitoringDepartmentIds
    : (user?.departmentId ? [user.departmentId] : []);
  const label = ids.map((id) => departmentsById[id]?.name).filter(Boolean).join(" & ") || null;
  return { ids, label };
}
