"use client";

import { useEffect } from "react";
import Icon from "@/components/Icons";

// Toast ringan buat feedback sukses/error setelah aksi (approve/reject/dll).
// Pemanggil cukup simpan { type: "success" | "error", message } di state,
// lalu render <Toast toast={toast} onClose={() => setToast(null)} />.
export default function Toast({ toast, onClose, duration = 3200 }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  return (
    <div aria-live="polite" className={`toast toast-${toast.type === "error" ? "error" : "success"}`} role="status">
      <Icon name={toast.type === "error" ? "info" : "check"} size={16} />
      <span>{toast.message}</span>
      <button aria-label="Tutup notifikasi" className="toast-close" onClick={() => onClose?.()} type="button">
        <Icon name="close" size={13} />
      </button>
    </div>
  );
}
