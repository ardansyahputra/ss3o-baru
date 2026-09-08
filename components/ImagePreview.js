"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icons";

export default function ImagePreview({ src, label, caption }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!src) return null;

  return (
    <>
      <button aria-label={`Lihat pratinjau ${label || "gambar"}`} className="preview-eye" onClick={() => setOpen(true)} title="Lihat pratinjau" type="button">
        <Icon name="eye" size={14} />
      </button>
      {open && (
        <div aria-modal="true" className="image-lightbox" onClick={() => setOpen(false)} role="dialog">
          <button aria-label="Tutup pratinjau" className="image-lightbox-close" onClick={() => setOpen(false)} type="button"><Icon name="close" size={18} /></button>
          <figure onClick={(event) => event.stopPropagation()}>
            <img alt={label || "Pratinjau bukti kerja"} src={src} />
            {caption && <figcaption>{caption}</figcaption>}
          </figure>
        </div>
      )}
    </>
  );
}
