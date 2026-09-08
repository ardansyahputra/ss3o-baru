"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icons";

export default function WelcomeOverlay({ user }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 2800);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    window.history.replaceState({}, "", window.location.pathname);
  }

  if (!visible) return null;
  return (
    <div aria-label="Pesan selamat datang" aria-live="polite" className="welcome-overlay" onClick={dismiss} role="dialog">
      <div className="welcome-glow" />
      <div className="welcome-card">
        <span className="welcome-check"><Icon name="check" size={20} /></span>
        <p className="eyebrow">SS3O WORKSPACE</p>
        <h2>Welcome, {user?.name || "Team"}!</h2>
        <p>Semua pekerjaan siap dipantau dalam satu workspace yang rapi.</p>
        <span className="welcome-hint">Klik untuk lanjut · otomatis menutup</span>
      </div>
    </div>
  );
}