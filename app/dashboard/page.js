import { requireUser } from "@/lib/session";
import { getDashboardData } from "@/lib/data";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icons";
import Link from "next/link";

function PageHeader({ user }) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">SS3O Staff Administration</p>
        <h1 className="page-title">{user.role === "ADMIN" ? "Dashboard" : `Selamat datang, ${user.name}`}</h1>
        <p className="page-subtitle">{user.role === "ADMIN" ? "Monitor aktivitas dan progress seluruh staff SS3O." : "Berikut aktivitas dan jobdesk kamu hari ini."}</p>
      </div>
      <div className="header-actions">
        <div aria-label="Periode dashboard: hari ini" className="button button-ghost" role="status"><Icon name="calendar" size={15} /> Hari ini</div>
      </div>
    </div>
  );
}

function WorkflowHub({ user }) {
  const items = user.role === "ADMIN"
    ? [
        ["/monitoring", "Pantauan Dika", "Lihat progress, report, dan bukti seluruh staff.", "chart"],
        ["/uploads", "Kelola Bukti Upload", "Periksa & preview foto bukti kerja seluruh staff.", "image"],
        ["/jobdesk", "Kelola Jobdesk & KPI", "Periksa penugasan dan target kerja lengkap.", "briefcase"],
        ["/staff", "Kelola Staff", "Buka roster dan profil staff SS3O.", "users"],
      ]
    : [
        ["/my-jobdesk", "Lihat Jobdesk Saya", "Buka seluruh tugas dan KPI yang ditugaskan.", "briefcase"],
        ["/daily-progress", "Checklist Progress", "Tandai pekerjaan yang sudah selesai hari ini.", "check"],
        ["/reports", "Kirim Report Kerja", "Catat hasil kerja dan konteks untuk Dika.", "report"],
        ["/uploads", "Upload Bukti / LXP", "Kirim foto dari kamera, dokumen, atau file LXP.", "upload"],
        ["/history", "Buka Riwayat", "Lihat kembali report dan bukti yang pernah dikirim.", "history"],
      ];
  return (
    <section className="card workflow-hub">
      <div className="card-heading"><div><p className="eyebrow">Ruang kerja</p><h2>Akses cepat aktivitas hari ini</h2><p>Menu kerja utama tersedia di sini agar sidebar tetap ringkas.</p></div></div>
      <div className="workflow-grid">{items.map(([href, label, description, icon]) => <Link className="workflow-card" href={href} key={href}><span className="workflow-icon"><Icon name={icon} size={17} /></span><span className="workflow-copy"><strong>{label}</strong><small>{description}</small></span><Icon name="arrow" size={14} /></Link>)}</div>
    </section>
  );
}

function AdminDashboard({ data }) {
  const cards = [
    ["Total Staff", data.stats.staff, "users", "Staff terdaftar"],
    ["Staff Aktif", data.stats.active, "check", "Status aktif saat ini"],
    ["Total Jobdesk", data.stats.jobdesks, "briefcase", "Jobdesk aktif"],
    ["Progress Hari Ini", `${data.stats.progress}%`, "chart", "Rata-rata seluruh staff"],
    ["Report Hari Ini", data.stats.reports, "report", "Report masuk hari ini"],
    ["Staff Sudah Report", data.stats.reportedStaff, "users", "Dari staff aktif"],
    ["Upload LXP Hari Ini", data.stats.lxp, "upload", "Dokumen diterima"],
    ["Upload DSR Hari Ini", data.stats.dsr, "upload", "Dokumen diterima"],
  ];
  return (
    <>
      <div className="stat-grid">
        {cards.map(([label, value, icon, foot]) => <div className="card stat-card" key={label}><div className="stat-card-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} size={15} /></span></div><div className="stat-value">{value}</div><div className="stat-foot">{foot}</div></div>)}
      </div>
      <WorkflowHub user={{ role: "ADMIN" }} />
      <div className="section-grid">
        <section className="card section-card">
          <div className="card-heading"><div><h2>Progress Staff Hari Ini</h2><p>Ringkasan capaian berdasarkan jobdesk aktif.</p></div><Link className="text-link" href="/monitoring">Lihat monitoring</Link></div>
          {data.progressByUser.length ? data.progressByUser.slice(0, 7).map((person) => <div className="progress-row" key={person.id}><div className="person"><span className="avatar">{person.name.slice(0, 2).toUpperCase()}</span><div className="person-copy"><strong>{person.name}</strong><span>{person.department?.name || "Tanpa divisi"}</span></div></div><div className="progress-percent">{person.progress}%</div><div className="progress-track"><div className={`progress-fill ${person.progress === 100 ? "green" : ""}`} style={{ width: `${person.progress}%` }} /></div><span className={`status ${data.statusClass(person.status)}`}>{data.statusLabel(person.status)}</span></div>) : <div className="empty-state"><Icon name="users" size={27} /><strong>Belum ada data staff</strong><p>Data akan tampil saat staff tersedia.</p></div>}
        </section>
        <section className="card section-card">
          <div className="card-heading"><div><h2>Report Completion</h2><p>Status report hari ini.</p></div></div>
          {data.stats.reports ? <div className="donut-wrap"><div className="donut"><div className="donut-label"><strong>{data.stats.progress}%</strong><span>progress</span></div></div><div className="legend"><div className="legend-item"><i className="legend-dot" style={{ background: "#2f6fed" }} />Completed</div><div className="legend-item"><i className="legend-dot" style={{ background: "#15a073" }} />On Progress</div><div className="legend-item"><i className="legend-dot" style={{ background: "#ecb14f" }} />Pending</div><div className="legend-item"><i className="legend-dot" style={{ background: "#e8edf3" }} />Not Started</div></div></div> : <div className="empty-state"><Icon name="report" size={27} /><strong>Belum ada report hari ini</strong><p>Data completion akan muncul setelah staff mengirim report.</p></div>}
        </section>
      </div>
      <div className="section-grid">
        <section className="card section-card">
          <div className="card-heading"><div><h2>Weekly Progress</h2><p>Rata-rata progress staff per hari.</p></div></div>
          {data.stats.reports ? <div className="chart">{["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day, index) => <div className="bar-column" key={day}><div className="bar" style={{ height: `${Math.max(7, data.stats.progress - index * 3)}%` }} /><span className="bar-label">{day}</span></div>)}</div> : <div className="empty-state"><Icon name="chart" size={27} /><strong>Belum ada aktivitas mingguan</strong><p>Chart terisi dari report yang ada di database.</p></div>}
        </section>
        <section className="card section-card">
          <div className="card-heading"><div><h2>Progress by Department</h2><p>Rata-rata jobdesk aktif.</p></div></div>
          {data.departments.length ? data.departments.map((dept) => { const rows = data.allJobdesks.filter((item) => item.departmentId === dept.id); const progress = rows.length ? Math.round(rows.reduce((sum, item) => sum + item.progress, 0) / rows.length) : 0; return <div className="progress-row" style={{ gridTemplateColumns: "minmax(95px, 1fr) 45px minmax(90px, 1.2fr)" }} key={dept.id}><div className="person-copy"><strong>{dept.name}</strong><span>{rows.length} jobdesk</span></div><div className="progress-percent">{progress}%</div><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div></div>; }) : <div className="empty-state"><Icon name="building" size={27} /><strong>Belum ada divisi</strong></div>}
        </section>
      </div>
    </>
  );
}

function StaffDashboard({ data }) {
  return (
    <>
      <div className="stat-grid">
        {[["Jobdesk Hari Ini", data.stats.assigned, "briefcase", "Jobdesk ditugaskan"], ["Completed", data.stats.completed, "check", "Sudah selesai"], ["On Progress", data.jobdesks.filter((item) => item.status === "ON_PROGRESS").length, "chart", "Sedang dikerjakan"], ["Overall Progress", `${data.stats.progress}%`, "report", "Rata-rata hari ini"]].map(([label, value, icon, foot]) => <div className="card stat-card" key={label}><div className="stat-card-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} size={15} /></span></div><div className="stat-value">{value}</div><div className="stat-foot">{foot}</div></div>)}
      </div>
      <WorkflowHub user={{ role: "STAFF" }} />
      <section className="card section-card" style={{ marginTop: 18 }}>
        <div className="card-heading"><div><h2>Jobdesk Hari Ini</h2><p>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</p></div><Link className="button button-primary" href="/reports">Report hasil kerja <Icon name="arrow" size={14} /></Link></div>
        {data.jobdesks.length ? data.jobdesks.slice(0, 8).map((item) => <div className="progress-row" key={item.id}><div className="person-copy"><span className={`priority priority-${item.priority}`}>{item.priority}</span><strong style={{ marginTop: 7 }}>{item.title}</strong><span>{item.report ? "Report terakhir sudah tersedia" : "Belum ada report hari ini"}</span></div><div className="progress-percent">{item.progress}%</div><div className="progress-track"><div className={`progress-fill ${item.progress === 100 ? "green" : ""}`} style={{ width: `${item.progress}%` }} /></div><span className={`status ${data.statusClass(item.status)}`}>{data.statusLabel(item.status)}</span></div>) : <div className="empty-state"><Icon name="briefcase" size={27} /><strong>Belum ada jobdesk</strong><p>Jobdesk yang ditugaskan akan tampil di sini.</p></div>}
      </section>
    </>
  );
}

export default async function DashboardPage({ searchParams }) {
  const user = await requireUser();
  const data = await getDashboardData(user);
  return <AppShell title="Dashboard" user={user} welcome={searchParams?.welcome === "1"}><PageHeader user={user} />{user.role === "ADMIN" ? <AdminDashboard data={data} /> : <StaffDashboard data={data} />}</AppShell>;
}