"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import Icon from "@/components/Icons";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
];

const adminNav = [
  { href: "/staff", label: "Staff", icon: "users" },
  { href: "/departments", label: "Divisi", icon: "building" },
  { href: "/monitoring", label: "Monitoring", icon: "chart" },
  { href: "/uploads", label: "Kelola Bukti Upload", icon: "image" },
];

function initials(name = "") {
  return name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "S";
}

const sidebarEmbers = [
  { left: "12%", top: "85%", size: 3, delay: "0.4s", dur: "6.5s", drift: "a" },
  { left: "68%", top: "72%", size: 4, delay: "1.6s", dur: "7.8s", drift: "b" },
  { left: "30%", top: "90%", size: 3, delay: "2.4s", dur: "6.2s", drift: "a" },
  { left: "80%", top: "88%", size: 3, delay: "0.9s", dur: "7.1s", drift: "b" },
  { left: "50%", top: "78%", size: 4, delay: "3.1s", dur: "6.8s", drift: "a" },
  { left: "20%", top: "68%", size: 3, delay: "1.2s", dur: "7.4s", drift: "b" },
];

export default function AppShell({ children, user, title, welcome = false }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";
  const active = (href) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  function NavLink({ item }) {
    return (
      <Link className={`nav-item ${active(item.href) ? "active" : ""}`} href={item.href} onClick={() => setOpen(false)}>
        <span className="nav-icon"><Icon name={item.icon} size={16} /></span>
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <div className="app-shell">
      <div aria-hidden="true" className="dashboard-ambient">
        <span className="fire-glow fire-glow-tl" />
        <span className="fire-glow fire-glow-br" />
      </div>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div aria-hidden="true" className="sidebar-ambient">
          <span className="fire-glow glow-top" />
          <span className="fire-glow glow-bottom" />
          {sidebarEmbers.map((e, i) => <span aria-hidden="true" className={`fire-ember drift-${e.drift}`} key={i} style={{ left: e.left, top: e.top, width: e.size, height: e.size, animationDelay: e.delay, animationDuration: e.dur }} />)}
        </div>
        <div className="brand">
          <div className="brand-mark brand-flame"><img alt="SS3O" src="/ss3o-flame-badge.svg" /></div>
          <div className="brand-copy"><strong>SS3O SYSTEM</strong><span>Staff administration</span></div>
        </div>
        <div className="sidebar-scroll">
          <div className="nav-section">Workspace</div>
          <nav aria-label="Workspace" className="nav-list">{mainNav.map((item) => <NavLink item={item} key={item.href} />)}</nav>
          {isAdmin && (
            <>
              <div className="nav-section">Administration</div>
              <nav aria-label="Administration" className="nav-list">{adminNav.map((item) => <NavLink item={item} key={item.href} />)}</nav>
            </>
          )}
          <div className="nav-section">Account</div>
          <nav aria-label="Account" className="nav-list">
            <NavLink item={{ href: "/profile", label: "Profile", icon: "user" }} />
            <NavLink item={{ href: "/settings", label: "Settings", icon: "settings" }} />
          </nav>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="avatar">{initials(user?.name)}</span>
            <div className="sidebar-user-copy"><strong>{user?.name}</strong><span>{user?.role === "ADMIN" ? "Administrator" : "Staff"} · {user?.departmentName || "SS3O"}</span><small><i /> Sesi aktif · 8 jam</small></div>
          </div>
          <button className="sidebar-logout" onClick={() => signOut({ callbackUrl: "https://ss3o-baru.vercel.app/login" })}><Icon name="logout" size={15} /><span>Logout session</span></button>
        </div>
      </aside>
      <button aria-label="Tutup menu" className="sidebar-backdrop" onClick={() => setOpen(false)} type="button" />

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button aria-expanded={open} aria-label={open ? "Tutup menu" : "Buka menu"} className="mobile-menu" onClick={() => setOpen(!open)} type="button"><Icon name="menu" size={20} /></button>
            <div className="breadcrumb"><span>SS3O / </span><strong>{title || "Workspace"}</strong></div>
          </div>
          <div className="topbar-right">
            <GlobalSearch isAdmin={isAdmin} />
            <NotificationBell isAdmin={isAdmin} />
            <div className="topbar-profile">
              <button aria-expanded={profileOpen} aria-haspopup="menu" className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)} type="button">
                <span className="avatar">{initials(user?.name)}</span>
                <span className="topbar-profile-copy"><strong>{user?.name}</strong><span>{user?.role === "ADMIN" ? "Admin" : "Staff"}</span></span>
                <Icon name="chevron" size={14} />
              </button>
              {profileOpen && <span className="profile-menu"><Link href="/profile" onClick={() => setProfileOpen(false)}><Icon name="user" size={14} /> Profile</Link><button onClick={() => signOut({ callbackUrl: "/login" })}><Icon name="logout" size={14} /> Logout session</button></span>}
            </div>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
      {welcome && <WelcomeOverlay user={user} />}
    </div>
  );
}