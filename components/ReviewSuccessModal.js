"use client";

import { useEffect } from "react";
import Icon from "@/components/Icons";

const CONTENT = {
  APPROVED: {
    icon: "check",
    tone: "success",
    title: "Berhasil disetujui",
    body: "Status upload sudah tersimpan sebagai Disetujui dan otomatis tersinkron ke dashboard staff yang bersangkutan.",
  },
  REVISION: {
    icon: "info",
    tone: "warning",
    title: "Catatan revisi terkirim",
    body: "Staff akan melihat catatan revisi ini di dashboard mereka dan bisa langsung mengunggah ulang buktinya.",
  },
  REJECTED: {
    icon: "close",
    tone: "danger",
    title: "Berhasil ditolak",
    body: "Status upload sudah tersimpan sebagai Ditolak dan otomatis tersinkron ke dashboard staff yang bersangkutan.",
  },
};

// Modal konfirmasi sukses setelah aksi Approve/Revisi/Reject di panel Proof
// Inspection. Dipakai selain Toast supaya reviewer benar-benar yakin aksinya
// tersimpan (bukan cuma notifikasi kecil di pojok yang gampang kelewat) dan
// tahu perubahannya sudah otomatis nyambung ke sisi staff.
export default function ReviewSuccessModal({ result, onClose }) {
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => onClose?.(), 3800);
    return () => clearTimeout(timer);
  }, [result, onClose]);

  if (!result) return null;
  const content = CONTENT[result.action] || CONTENT.APPROVED;

  return (
    <div className="success-modal-backdrop" onClick={onClose}>
      <div className="success-modal" role="alertdialog" aria-live="assertive" onClick={(event) => event.stopPropagation()}>
        <div className={`success-modal-icon success-modal-icon-${content.tone}`}>
          <Icon name={content.icon} size={22} />
        </div>
        <h3>{content.title}</h3>
        <p>{content.body}</p>
        {result.targetName && <div className="success-modal-target">{result.targetName}</div>}
        <button className="button button-primary" type="button" onClick={onClose}>Oke, Mengerti</button>
      </div>
    </div>
  );
}
