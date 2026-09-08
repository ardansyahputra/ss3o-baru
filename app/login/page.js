"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";

const demoUsers = [
  ["Dika", "dika@ss3o.com", "Store Leader"],
  ["Ardan", "ardan@ss3o.com", "Admin Store"],
  ["Fatimah", "fatimah@ss3o.com", "Kasir"],
  ["Tito", "tito@ss3o.com", "Stockroom"],
  ["Putra", "putra@ss3o.com", "Security"],
];

// Bara api tersebar di seluruh layar — kiri, kanan, atas, bawah, dan tengah —
// posisi & waktu tetap (bukan Math.random) supaya tidak ada mismatch SSR/CSR.
const embers = [
  { left: "4%", top: "12%", size: 5, delay: "0s", dur: "7.5s", drift: "a" },
  { left: "9%", top: "78%", size: 4, delay: "1.1s", dur: "6.2s", drift: "b" },
  { left: "17%", top: "42%", size: 6, delay: "2.3s", dur: "8.4s", drift: "a" },
  { left: "26%", top: "8%", size: 3, delay: "0.6s", dur: "6.8s", drift: "b" },
  { left: "33%", top: "88%", size: 5, delay: "3.1s", dur: "7.1s", drift: "a" },
  { left: "41%", top: "58%", size: 4, delay: "1.8s", dur: "9s", drift: "b" },
  { left: "6%", top: "55%", size: 3, delay: "2.9s", dur: "6.5s", drift: "a" },
  { left: "49%", top: "20%", size: 4, delay: "2.2s", dur: "7.4s", drift: "a" },
  { left: "55%", top: "16%", size: 5, delay: "0.3s", dur: "7.8s", drift: "b" },
  { left: "62%", top: "72%", size: 4, delay: "1.4s", dur: "6.9s", drift: "a" },
  { left: "70%", top: "38%", size: 6, delay: "2.6s", dur: "8.1s", drift: "b" },
  { left: "78%", top: "90%", size: 3, delay: "3.4s", dur: "7.3s", drift: "a" },
  { left: "85%", top: "22%", size: 5, delay: "0.9s", dur: "6.4s", drift: "b" },
  { left: "92%", top: "64%", size: 4, delay: "2.1s", dur: "8.6s", drift: "a" },
  { left: "96%", top: "10%", size: 3, delay: "1.6s", dur: "7.6s", drift: "b" },
  { left: "48%", top: "94%", size: 5, delay: "2.8s", dur: "6.7s", drift: "a" },
  { left: "14%", top: "96%", size: 3, delay: "0.4s", dur: "8.9s", drift: "b" },
  { left: "60%", top: "48%", size: 4, delay: "3.6s", dur: "7.2s", drift: "a" },
  { left: "89%", top: "48%", size: 3, delay: "1.2s", dur: "6.3s", drift: "b" },
  { left: "23%", top: "66%", size: 3, delay: "3.9s", dur: "7.9s", drift: "b" },
];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await signIn("credentials", { ...form, redirect: false });
      if (response?.error) {
        setError(response.error === "CredentialsSignin" ? "Email atau password salah." : response.error);
        return;
      }
      router.push("/dashboard?welcome=1");
      router.refresh();
    } catch {
      setError("Terjadi gangguan saat masuk. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function selectDemo(email) {
    setForm({ email, password: "ss3o12345" });
    setError("");
  }

  function handlePointerMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
    });
  }

  const badgeTransform = `translate(-50%, -50%) perspective(1050px) rotateX(${pointer.y * -4}deg) rotateY(${pointer.x * 6}deg)`;

  return <main className="login-page">
    <div aria-hidden="true" className="login-fire-stage">
      <div className="fire-mesh" />
      <span className="fire-glow fire-glow-tl" />
      <span className="fire-glow fire-glow-tr" />
      <span className="fire-glow fire-glow-bl" />
      <span className="fire-glow fire-glow-br" />
      <span className="fire-glow fire-glow-center" />
      <div className="fire-orbit orbit-a" />
      <div className="fire-orbit orbit-b" />
      <img alt="" className="fire-badge-watermark" src="/ss3o-flame-badge.svg" style={{ transform: badgeTransform }} />
      {embers.map((e, i) => <span aria-hidden="true" className={`fire-ember drift-${e.drift}`} key={i} style={{ left: e.left, top: e.top, width: e.size, height: e.size, animationDelay: e.delay, animationDuration: e.dur }} />)}
    </div>
    <section className="login-aside" onPointerLeave={() => setPointer({ x: 0, y: 0 })} onPointerMove={handlePointerMove}>
      <div className="login-brand"><span className="brand-mark brand-flame"><img alt="SS3O" src="/ss3o-flame-badge.svg" /></span><div><strong>SS3O SYSTEM</strong><span>Staff administration</span></div></div>
      <div className="login-quote"><p className="eyebrow">One workspace. Clear ownership.</p><h1>Make every task<br /><em>visible and moving.</em></h1><p>Kelola jobdesk, progress, dan report tim SS3O dalam satu dashboard yang terstruktur.</p><div className="login-aside-note"><i /> Data kerja tersusun untuk keputusan yang lebih cepat.</div></div>
      <div className="fire-stat fire-stat-progress"><small>TEAM PROGRESS</small><strong>82.4%</strong><span><i /> +12.8% this week</span></div>
      <div className="fire-stat fire-stat-tasks"><span className="visual-mini-icon"><Icon name="check" size={11} /></span><div><small>TASKS COMPLETED</small><strong>1,248</strong></div></div>
      <div className="login-aside-foot">Enterprise Staff Administration & Jobdesk Management <span>● Secure workspace</span></div>
    </section>
    <section className="login-panel">
      <div className="login-panel-glow" />
      <div className="login-form-wrap">
        <div className="mobile-login-brand"><span className="brand-mark brand-flame"><img alt="SS3O" src="/ss3o-flame-badge.svg" /></span><strong>SS3O SYSTEM</strong></div>
        <div className="login-kicker"><span className="pulse-dot" /> Secure workspace access</div>
        <p className="eyebrow">Welcome back</p>
        <h1>Masuk ke workspace</h1>
        <p className="login-subtitle">Gunakan akun SS3O kamu untuk melanjutkan ke ruang kerja tim.</p>
        <form aria-label="Form masuk SS3O" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="login-email"><span>Email address</span><span className="login-input-wrap"><Icon name="user" size={16} /><input autoComplete="email" id="login-email" type="email" required placeholder="nama@ss3o.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></span></label>
          <label className="login-label" htmlFor="login-password"><span>Password</span><span className="login-input-wrap"><Icon name="shield" size={16} /><input autoComplete="current-password" id="login-password" type={showPassword ? "text" : "password"} required placeholder="Masukkan password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} className="password-toggle" onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? "Hide" : "Show"}</button></span></label>
          {error && <div aria-live="polite" className="login-error" role="alert"><Icon name="info" size={15} />{error}</div>}
          <button className="login-button" disabled={loading} type="submit"><span>{loading ? <><i className="button-spinner" /> Memverifikasi...</> : "Masuk ke Dashboard"}</span><Icon name="arrow" size={16} /></button>
        </form>
        <div className="quick-switcher"><span>Quick access · akun demo untuk pratinjau</span><div>{demoUsers.map(([name, email, role]) => <button aria-label={`Pilih akun ${name}, ${role}`} key={email} className={form.email === email ? "selected" : ""} onClick={() => selectDemo(email)} type="button"><b>{name.slice(0, 2).toUpperCase()}</b><span>{name}<small>{role}</small></span></button>)}</div></div>
        <div className="login-trust"><Icon name="shield" size={13} /><span>Session terenkripsi · Akses berdasarkan role</span></div>
        <p className="login-help">Password demo: <strong>ss3o12345</strong> · Butuh akses? Hubungi administrator.</p>
      </div>
    </section>
  </main>;
}
