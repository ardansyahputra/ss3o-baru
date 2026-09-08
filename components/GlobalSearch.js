"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";

export default function GlobalSearch({ isAdmin = false }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event) {
    event.preventDefault();
    const value = query.trim();
    router.push(`${isAdmin ? "/jobdesk" : "/my-jobdesk"}${value ? `?search=${encodeURIComponent(value)}` : ""}`);
  }

  return <form aria-label="Pencarian global" className="search-box" onSubmit={submit}><Icon name="search" size={15} /><input aria-label="Cari jobdesk" placeholder="Search jobdesk..." value={query} onChange={(event) => setQuery(event.target.value)} /></form>;
}