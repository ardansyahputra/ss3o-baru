const db = require("@/lib/db");

function dayKey(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}

async function departmentMap() {
  const departments = await db.all("departments");
  return Object.fromEntries(departments.map((item) => [item.id, item]));
}

async function latestReports() {
  const latest = new Map();
  const reports = await db.all("daily_reports");
  for (const report of reports) {
    const key = `${report.jobdeskId}:${report.userId}:${report.date || ""}`;
    const previous = latest.get(key);
    if (!previous || new Date(report.updatedAt || report.createdAt) > new Date(previous.updatedAt || previous.createdAt)) {
      latest.set(key, report);
    }
  }
  return latest;
}

// Progress otomatis untuk jobdesk yang punya target jumlah submit (misal target
// 200x = 100%). Dihitung KUMULATIF dari semua daily_reports milik staff itu di
// jobdesk ini yang statusnya sudah APPROVED oleh Admin — tidak reset per hari.
async function approvedSubmitCount(jobdeskId, userId) {
  const rows = await db.filter("daily_reports", (item) => item.jobdeskId === jobdeskId && item.userId === userId && item.approvalStatus === "APPROVED");
  return rows.length;
}

async function enrichJobdesk(jobdesk, users, departments, reports) {
  const user = users.find((item) => item.id === jobdesk.userId);
  const department = departments[jobdesk.departmentId];
  const report = reports.get(`${jobdesk.id}:${jobdesk.userId}:${dayKey()}`);
  const checklist = await db.find("daily_progress", (item) => item.jobdeskId === jobdesk.id && item.userId === jobdesk.userId && item.date === dayKey());
  const kpis = await db.filter("kpis", (item) => item.jobdeskId === jobdesk.id);
  const targetCount = Number(jobdesk.targetCount) > 0 ? Math.round(Number(jobdesk.targetCount)) : null;
  const approvedCount = targetCount ? await approvedSubmitCount(jobdesk.id, jobdesk.userId) : null;
  let progress;
  let status;
  if (targetCount) {
    progress = Math.min(100, Math.round((approvedCount / targetCount) * 100));
    status = progress >= 100 ? "COMPLETED" : approvedCount > 0 ? "ON_PROGRESS" : "NOT_STARTED";
  } else {
    progress = checklist ? (checklist.completed ? 100 : Number(checklist.progress || 0)) : Math.max(0, Math.min(100, Number(report?.progress || 0)));
    status = checklist ? (checklist.completed ? "COMPLETED" : "NOT_STARTED") : (report?.status || (progress === 100 ? "COMPLETED" : progress > 0 ? "ON_PROGRESS" : "NOT_STARTED"));
  }
  return { ...jobdesk, user, department, kpis, checklist, report, progress, status, targetCount, approvedCount };
}

function statusLabel(status) {
  return {
    COMPLETED: "Completed",
    ON_PROGRESS: "On Progress",
    PENDING: "Pending",
    NOT_STARTED: "Not Started",
    REVISION: "Revision",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  }[status] || status || "Not Started";
}

function statusClass(status) {
  return {
    COMPLETED: "status-completed",
    APPROVED: "status-completed",
    ON_PROGRESS: "status-progress",
    PENDING: "status-pending",
    REVISION: "status-revision",
    REJECTED: "status-revision",
    NOT_STARTED: "status-not-started",
  }[status] || "status-not-started";
}

function reviewStatusLabel(status) {
  return {
    APPROVED: "Disetujui",
    REVISION: "Perlu Revisi",
    REJECTED: "Ditolak",
    PENDING: "Menunggu Review",
    NOT_SUBMITTED: "Belum Submit",
  }[status] || "Menunggu Review";
}

async function uploadRowsFor(userId) {
  const sources = [
    ["work", "Hasil Kerja", "work_uploads"],
    ["lxp", "LXP", "lxp_uploads"],
    ["dsr", "DSR Staff", "dsr_uploads"],
  ];
  const jobdesks = await db.all("jobdesks");
  const rows = [];
  for (const [type, label, table] of sources) {
    const items = await db.all(table);
    for (const item of items) {
      if (userId && item.userId !== userId) continue;
      rows.push({ ...item, type, typeLabel: label, jobdeskTitle: jobdesks.find((jobdesk) => jobdesk.id === item.jobdeskId)?.title || null, approvalStatus: item.approvalStatus || "PENDING" });
    }
  }
  return rows;
}

async function getMonitoringData() {
  const allUsers = await db.all("users");
  const users = allUsers.filter((item) => item.isActive !== false);
  const departments = await departmentMap();
  const reports = await latestReports();
  const today = dayKey();
  const rawJobdesks = (await db.all("jobdesks")).filter((item) => item.active !== false);
  const allJobdesks = await Promise.all(rawJobdesks.map((jobdesk) => enrichJobdesk(jobdesk, users, departments, reports)));
  const allDailyReports = await db.all("daily_reports");

  return Promise.all(users.map(async (person) => {
    const jobs = allJobdesks.filter((item) => item.userId === person.id);
    const personReports = allDailyReports.filter((item) => item.userId === person.id && item.date === today).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    const latestReport = personReports[0] || null;
    const uploads = await uploadRowsFor(person.id);
    const progress = jobs.length ? Math.round(jobs.reduce((sum, item) => sum + item.progress, 0) / jobs.length) : 0;
    const reviewStatus = latestReport ? (latestReport.approvalStatus || "PENDING") : "NOT_SUBMITTED";
    return {
      id: person.id,
      name: person.name,
      email: person.email,
      position: person.position || "Staff",
      department: departments[person.departmentId]?.name || "Tanpa divisi",
      progress,
      status: progress === 100 ? "COMPLETED" : progress > 0 ? "ON_PROGRESS" : "NOT_STARTED",
      reviewStatus,
      reviewStatusLabel: reviewStatusLabel(reviewStatus),
      report: latestReport ? { ...latestReport, jobdeskTitle: jobs.find((item) => item.id === latestReport.jobdeskId)?.title || "Jobdesk" } : null,
      jobs: jobs.map((item) => ({ id: item.id, title: item.title, priority: item.priority, progress: item.progress, status: item.status, statusText: statusLabel(item.status) })),
      uploads,
      uploadCount: uploads.length,
    };
  }));
}

async function getDashboardData(user) {
  const users = await db.all("users");
  const departments = await departmentMap();
  const reports = await latestReports();
  const rawJobdesks = (await db.all("jobdesks")).filter((jobdesk) => jobdesk.active !== false);
  const allJobdesks = await Promise.all(rawJobdesks.map((jobdesk) => enrichJobdesk(jobdesk, users, departments, reports)));
  const today = dayKey();
  const visibleJobdesks = user.role === "ADMIN" ? allJobdesks : allJobdesks.filter((item) => item.userId === user.id);
  const activeUsers = users.filter((item) => item.isActive !== false);
  const todayReports = (await db.all("daily_reports")).filter((item) => item.date === today);
  const avg = visibleJobdesks.length ? Math.round(visibleJobdesks.reduce((sum, item) => sum + item.progress, 0) / visibleJobdesks.length) : 0;
  const completed = visibleJobdesks.filter((item) => item.status === "COMPLETED").length;
  const lxpToday = user.role === "ADMIN" ? (await db.all("lxp_uploads")).filter((item) => item.date === today).length : 0;
  const dsrToday = user.role === "ADMIN" ? (await db.all("dsr_uploads")).filter((item) => item.date === today).length : 0;
  return {
    users,
    departments: Object.values(departments),
    jobdesks: visibleJobdesks,
    allJobdesks,
    stats: user.role === "ADMIN"
      ? { staff: activeUsers.length, active: activeUsers.length, jobdesks: allJobdesks.length, progress: avg, reports: todayReports.length, reportedStaff: new Set(todayReports.map((item) => item.userId)).size, lxp: lxpToday, dsr: dsrToday }
      : { assigned: visibleJobdesks.length, completed, progress: avg, reports: todayReports.filter((item) => item.userId === user.id).length },
    progressByUser: user.role === "ADMIN"
      ? activeUsers.map((person) => {
        const rows = allJobdesks.filter((item) => item.userId === person.id);
        return { ...person, department: departments[person.departmentId], progress: rows.length ? Math.round(rows.reduce((sum, item) => sum + item.progress, 0) / rows.length) : 0, status: rows.length && rows.every((item) => item.status === "COMPLETED") ? "COMPLETED" : rows.some((item) => item.progress > 0) ? "ON_PROGRESS" : "NOT_STARTED" };
      })
      : [],
    statusLabel,
    statusClass,
  };
}

async function getUserJobdesks(user) {
  const data = await getDashboardData(user);
  return data.jobdesks;
}

// Dipakai halaman detail staff (admin) — rincian jobdesk milik SATU staff
// tertentu, dengan progress/status yang dihitung dengan cara yang SAMA
// persis seperti di dashboard/jobdesk (termasuk yang pakai target submit).
async function getStaffJobdesks(staffId) {
  const users = await db.all("users");
  const departments = await departmentMap();
  const reports = await latestReports();
  const rawJobdesks = (await db.all("jobdesks")).filter((item) => item.active !== false && item.userId === staffId);
  return Promise.all(rawJobdesks.map((jobdesk) => enrichJobdesk(jobdesk, users, departments, reports)));
}

module.exports = { dayKey, getDashboardData, getMonitoringData, getStaffJobdesks, getUserJobdesks, reviewStatusLabel, statusClass, statusLabel, uploadRowsFor };
