import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import db from "@/lib/db";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";

export default async function DepartmentDetailPage({ params }) {
  const user = await requireAdmin();
  const department = await db.find("departments", (item) => item.id === params.id);
  if (!department) notFound();
  const staff = await db.filter("users", (item) => item.departmentId === department.id);
  const jobdesks = await db.filter("jobdesks", (item) => item.departmentId === department.id);
  return <AppShell title="Department Detail" user={user}><div className="page-header"><div><p className="eyebrow">Department</p><h1 className="page-title">{department.name}</h1><p className="page-subtitle">Staff dan jobdesk dalam department ini.</p></div><a className="button button-ghost" href="/departments"><Icon name="arrow" size={14} /> Kembali</a></div><div className="stat-grid"><div className="card stat-card"><div className="stat-card-top"><span>Staff</span><span className="stat-icon"><Icon name="users" size={15} /></span></div><div className="stat-value">{staff.length}</div></div><div className="card stat-card"><div className="stat-card-top"><span>Jobdesk</span><span className="stat-icon"><Icon name="briefcase" size={15} /></span></div><div className="stat-value">{jobdesks.length}</div></div></div><section className="card section-card" style={{ marginTop: 18 }}><div className="card-heading"><div><h2>Staff di {department.name}</h2><p>Daftar akun berdasarkan data existing.</p></div></div>{staff.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Staff</th><th>Position</th><th>Role</th><th>Aksi</th></tr></thead><tbody>{staff.map((item) => <tr key={item.id}><td><div className="person"><span className="avatar">{item.name.slice(0, 2).toUpperCase()}</span><div className="person-copy"><strong>{item.name}</strong><span>{item.email}</span></div></div></td><td>{item.position || "-"}</td><td>{item.role}</td><td><a className="text-link" href={`/staff/${item.id}`}>View</a></td></tr>)}</tbody></table></div> : <div className="empty-state"><Icon name="users" size={27} /><strong>Belum ada staff</strong></div>}</section></AppShell>;
}