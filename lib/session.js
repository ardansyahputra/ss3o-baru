import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/roles";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

// Dipakai KHUSUS halaman Monitoring — role LEADER ("2nd Leader", mis. Aldo,
// Ilham, Rizki) boleh buka Monitoring (dibatasi ke divisi tanggung jawabnya
// sendiri, lihat app/monitoring/page.js), tapi TIDAK untuk halaman admin
// lain seperti Staff/Divisi/Kelola Bukti Upload — itu tetap requireAdmin()
// di atas, khusus role ADMIN penuh.
export async function requireAdminOrLeader() {
  const user = await requireUser();
  if (!isAdminRole(user.role)) {
    redirect("/dashboard");
  }
  return user;
}
