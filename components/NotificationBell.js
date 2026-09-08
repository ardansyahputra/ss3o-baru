"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";
import ImagePreview from "@/components/ImagePreview";

const SEEN_KEY = "ss3o_notifications_last_seen";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return "Baru saja";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} menit lalu`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} jam lalu`;
  return `${Math.floor(diffMs / day)} hari lalu`;
}

function reviewStatusClass(status) {
  if (status === "APPROVED") return "status-completed";
  if (status === "REVISION" || status === "REJECTED") return "status-revision";
  return "status-pending";
}

function itemText(item) {
  if (item.kind === "review") return `${item.typeLabel} — ${item.jobdeskTitle || "Jobdesk"}`;
  if (item.type === "report") return <><strong>{item.staffName}</strong> mengirim report untuk {item.jobdeskTitle}</>;
  return <><strong>{item.staffName}</strong> upload foto {item.typeLabel}{item.jobdeskTitle ? ` — ${item.jobdeskTitle}` : ""}</>;
}

export default function NotificationBell({ isAdmin }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);

  useEffect(() => {
    setLastSeen(Number(window.localStorage.getItem(SEEN_KEY)) || 0);
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/notifications");
        const result = await response.json();
        if (!cancelled && response.ok) setItems(result.notifications || []);
      } catch {
        // Diam-diam gagal — bel notifikasi bukan hal kritis, jangan ganggu halaman lain.
      }
    }
    load();
    const interval = window.setInterval(load, 30000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  const unreadCount = items.filter((item) => new Date(item.time).getTime() > lastSeen).length;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      fetch("/api/notifications").then((response) => response.json()).then((result) => setItems(result.notifications || [])).catch(() => {}).finally(() => setLoading(false));
      const newest = items[0]?.time ? new Date(items[0].time).getTime() : Date.now();
      const seenAt = Math.max(newest, Date.now() - 1000);
      window.localStorage.setItem(SEEN_KEY, String(seenAt));
      setLastSeen(seenAt);
    }
  }

  function openItem(href) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div className="notification-wrap">
      <button aria-expanded={open} aria-haspopup="true" aria-label="Notifications" className="icon-button" onClick={toggle} type="button">
        <Icon name="bell" size={17} />
        {unreadCount > 0 && <span className="notification-dot" />}
      </button>
      {open && (
        <div className="notification-menu notification-menu-list" role="status">
          <div className="notification-menu-head">
            <strong>{isAdmin ? "Aktivitas Staff" : "Notifikasi Kamu"}</strong>
            <span>{isAdmin ? "Semua report & upload masuk otomatis di sini" : "Hasil review dari Dika akan muncul di sini"}</span>
          </div>
          {loading && !items.length ? (
            <div className="notification-empty">Memuat...</div>
          ) : items.length ? (
            <div className="notification-items">
              {items.map((item) => (
                <div className="notification-item" key={item.id} onClick={() => openItem(item.href)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") openItem(item.href); }}>
                  {item.imageUrl ? (
                    <span className="notification-thumb-wrap">
                      <img alt="" className="notification-thumb" src={item.imageUrl} />
                      <span className="notification-thumb-eye" onClick={(event) => event.stopPropagation()}>
                        <ImagePreview caption={`${item.staffName ? `${item.staffName} · ` : ""}${item.typeLabel}${item.jobdeskTitle ? ` · ${item.jobdeskTitle}` : ""}`} label={item.fileName} src={item.imageUrl} />
                      </span>
                    </span>
                  ) : (
                    <span className="notification-thumb notification-thumb-icon"><Icon name={item.type === "report" ? "report" : "camera"} size={15} /></span>
                  )}
                  <span className="notification-item-copy">
                    <span>{itemText(item)}</span>
                    {item.kind === "review" && <span className={`status ${reviewStatusClass(item.reviewStatus)} notification-status`}>{item.reviewStatusLabel}</span>}
                    {item.reviewNotes && <small className="notification-note">"{item.reviewNotes}"</small>}
                    <small>{timeAgo(item.time)}</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="notification-empty">Belum ada notifikasi baru</div>
          )}
        </div>
      )}
    </div>
  );
}
