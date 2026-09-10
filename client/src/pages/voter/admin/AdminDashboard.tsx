import { useCallback, useEffect, useRef, useState } from "react";
import type { SVGProps } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { api } from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import BrandLogo from "../../../components/BrandLogo";
import { ThemeSettings } from "../../../components/ThemeSettings";

/* ---------------- types (matches getAdminDashboard) ---------------- */
interface Stats {
  totalVoters: number;
  activeElections: number;
  completedElections: number;
  totalVotes: number;
  voterTurnout: number; // percentage 0–100
}

/* ---------------- count-up hook ---------------- */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

/* ---------------- icons ---------------- */
type Icon = SVGProps<SVGSVGElement>;
const GridIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const ShieldIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
);
const UsersIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3 3.4-4.5 6.5-4.5s5.7 1.5 6.5 4.5" /><path d="M16 5a3.5 3.5 0 0 1 0 6.6M18.5 15.7c1.6.7 2.6 1.9 3 3.3" />
  </svg>
);
const ClockIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);
const CheckCircleIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" />
  </svg>
);
const ReceiptIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 3h14v18l-2.33-1.5L14.33 21 12 19.5 9.67 21l-2.34-1.5L5 21V3Z" /><path d="M9 8h6M9 12h6" />
  </svg>
);
const ScrollIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);
const ChartIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10Z" />
  </svg>
);
const BallotIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="m8.5 11.5 2.5 2.5 4.5-5" />
  </svg>
);
const MenuIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);
const CloseIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const ArrowIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);
const CalendarIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" />
  </svg>
);

/* ---------------- nav ---------------- */
const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: GridIcon },
  { path: "/admin/elections", label: "Elections", icon: ShieldIcon },
  { path: "/admin/voters", label: "Voters", icon: UsersIcon },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: ScrollIcon },
  { path: "/admin/results", label: "Results", icon: ChartIcon },
];

/* ---------------- small components ---------------- */
const toneStyles: Record<string, string> = {
  brand:  "from-brand-500 to-brand-700 shadow-brand-500/30",
  amber:  "from-amber-500 to-orange-500 shadow-amber-500/30",
  sky:    "from-sky-500 to-indigo-500 shadow-sky-500/30",
  violet: "from-violet-500 to-fuchsia-500 shadow-violet-500/30",
};

function StatCard({
  value, label, tone, icon, badge, delay,
}: {
  value: number; label: string; tone: string; icon: React.ReactNode;
  badge?: { text: string; className: string } | null; delay: number;
}) {
  const counted = useCountUp(value);
  return (
    <div
      className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg ${toneStyles[tone]}`}>
          {icon}
        </div>
        {badge && (
          <span className={`rounded-full px-2.5 py-1 font-sans text-[11px] font-bold ${badge.className}`}>
            {badge.text}
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-extrabold tabular-nums text-brand-900">{counted.toLocaleString()}</p>
      <p className="mt-0.5 font-sans text-sm font-medium text-ink-500">{label}</p>
    </div>
  );
}

function TurnoutRing({ percentage }: { percentage: number }) {
  const pct = Math.max(0, Math.min(percentage, 100));
  const [mounted, setMounted] = useState(false);
  const R = 52;
  const C = 2 * Math.PI * R;

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 100);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="relative grid h-36 w-36 shrink-0 place-items-center">
      <svg viewBox="0 0 128 128" className="h-36 w-36 -rotate-90">
        <circle cx="64" cy="64" r={R} fill="none" stroke="#deece9" strokeWidth="11" />
        <circle
          cx="64" cy="64" r={R} fill="none"
          stroke="url(#turnoutGradient)"
          strokeWidth="11" strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={mounted ? C * (1 - pct / 100) : C}
          style={{ transition: "stroke-dashoffset 1200ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        <defs>
          <linearGradient id="turnoutGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#117f76" />
            <stop offset="100%" stopColor="#0e4643" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-extrabold tabular-nums text-brand-900">
          {pct.toFixed(pct % 1 === 0 ? 0 : 1)}%
        </p>
        <p className="font-sans text-[11px] font-medium text-ink-500">turnout</p>
      </div>
    </div>
  );
}

function QuickAction({
  to, icon, title, subtitle, tone, delay,
}: {
  to: string; icon: React.ReactNode; title: string; subtitle: string; tone: string; delay: number;
}) {
  return (
    <Link
      to={to}
      className="animate-fade-up group flex items-center gap-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/50 hover:bg-white hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white shadow-md ${toneStyles[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-sm font-bold text-brand-900 transition-colors group-hover:text-brand-600">{title}</p>
        <p className="truncate font-sans text-xs text-ink-500">{subtitle}</p>
      </div>
      <ArrowIcon className="h-4 w-4 shrink-0 text-brand-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-brand-600" />
    </Link>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-40 animate-pulse rounded-3xl bg-brand-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-brand-200/70" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-brand-200/70" />
        <div className="h-64 animate-pulse rounded-2xl bg-brand-200/70" />
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const adminClickCount = useRef(0);
  const adminClickTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      // ✅ your real endpoint
      const response = await api.get("/admin/dashboard");
      setStats(response.data.data);
    } catch {
      setError("Unable to load dashboard statistics.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleAdminSecretClick = () => {
    adminClickCount.current += 1;
    if (adminClickTimer.current) window.clearTimeout(adminClickTimer.current);
    adminClickTimer.current = window.setTimeout(() => { adminClickCount.current = 0; }, 900);
    if (adminClickCount.current === 3) {
      adminClickCount.current = 0;
      setPasswordMessage("");
      setPasswordPanelOpen(true);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage("");
    if (newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await api.patch("/auth/change-password", { newPassword });
      setPasswordMessage("Password changed successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError: any) {
      setPasswordMessage(requestError?.response?.data?.message ?? "Unable to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const turnout = stats ? Math.max(0, Math.min(stats.voterTurnout ?? 0, 100)) : 0;
  const activeVotes = stats ? Math.round((turnout / 100) * stats.totalVoters) : 0;

  return (
    <div className="min-h-screen bg-brand-50 pt-16 font-serif text-ink-900">
      {/* ── Navbar ── */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between gap-4 bg-brand-900 px-4 font-sans text-white shadow-md lg:px-6">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 transition hover:bg-white/10 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1">
            <BrandLogo />
          </span>
          <span className="hidden text-[1.05rem] font-semibold tracking-wide sm:block">
            CPSU E-Voting
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleAdminSecretClick}
            className="bg-transparent p-0 text-sm font-medium text-brand-300 hover:bg-transparent"
            aria-label="Administrator account"
          >
            CPSU Administrator
          </button>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20 active:scale-95"
          >
            Log out
          </button>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      {passwordPanelOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 p-4">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 font-sans shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="change-admin-password-title">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="change-admin-password-title" className="m-0 text-xl font-bold text-brand-900">Change administrator password</h2>
                <p className="mt-1 text-sm text-ink-500">Set a new password for the administrator account.</p>
              </div>
              <button type="button" onClick={() => setPasswordPanelOpen(false)} className="bg-transparent p-1 text-xl text-ink-500 hover:bg-brand-50" aria-label="Close password form">×</button>
            </div>
            <form className="grid gap-4" onSubmit={handlePasswordChange}>
              <label className="grid gap-1.5 text-sm font-bold text-ink-700">
                New password
                <input type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-ink-700">
                Confirm new password
                <input type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required />
              </label>
              {passwordMessage && <p className="m-0 text-sm font-semibold text-brand-700" role="status">{passwordMessage}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setPasswordPanelOpen(false)} className="bg-brand-100 text-brand-700 hover:bg-brand-200">Cancel</button>
                <button type="submit" disabled={passwordSaving}>{passwordSaving ? "Saving…" : "Save password"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`admin-dashboard-sidebar fixed bottom-0 left-0 top-16 z-40 w-64 border-r border-brand-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col gap-1 p-4">
          <p className="mb-3 px-2 font-sans text-[11px] font-extrabold uppercase tracking-[0.08em] text-ink-400">
            Administration
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-sans text-sm transition ${
                  active
                    ? "bg-brand-100 font-bold text-brand-700"
                    : "font-medium text-ink-600 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-settings"><ThemeSettings /></div>
      </aside>

      {/* ── Main ── */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
          {error ? (
            <div className="mx-auto mt-10 max-w-md rounded-2xl border border-danger-50 bg-danger-50 p-8 text-center ring-1 ring-danger-700/10">
              <p role="alert" className="font-sans font-semibold text-danger-700">{error}</p>
              <button onClick={load} className="mt-4 active:scale-95">Try again</button>
            </div>
          ) : !stats ? (
            <Skeleton />
          ) : (
            <div className="space-y-6">
              {/* Hero */}
              <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
                  Overview of your election system
                </p>
                <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Admin Dashboard</h1>
                <p className="mt-3 max-w-xl font-sans text-brand-100/90">
                  {stats.activeElections > 0
                    ? `${stats.activeElections === 1 ? "There is 1 election" : `There are ${stats.activeElections} elections`} currently live — voters are casting ballots right now.`
                    : "No elections are currently open. Start one from Manage Elections below."}
                </p>
                <div className="mt-6 flex flex-wrap gap-2 font-sans text-xs font-medium">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
                    <ShieldIcon className="h-3.5 w-3.5" /> System healthy · All tallies verified
                  </span>
                </div>
              </section>

              {/* Stats */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  value={stats.totalVoters} label="Total Voters" tone="brand" delay={80}
                  icon={<UsersIcon className="h-5 w-5" />}
                  badge={stats.totalVoters > 0
                    ? { text: "Active", className: "bg-brand-50 text-brand-700 ring-1 ring-brand-500/25" }
                    : { text: "None yet", className: "bg-slate-100 text-slate-500 ring-1 ring-slate-500/15" }}
                />
                <StatCard
                  value={stats.activeElections} label="Active Elections" tone="amber" delay={160}
                  icon={<ClockIcon className="h-5 w-5" />}
                  badge={stats.activeElections > 0
                    ? { text: "Live", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/25" }
                    : { text: "None open", className: "bg-slate-100 text-slate-500 ring-1 ring-slate-500/15" }}
                />
                <StatCard
                  value={stats.completedElections} label="Completed" tone="sky" delay={240}
                  icon={<CheckCircleIcon className="h-5 w-5" />}
                  badge={stats.completedElections > 0
                    ? { text: "Done", className: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/25" }
                    : null}
                />
                <StatCard
                  value={stats.totalVotes} label="Votes Cast" tone="violet" delay={320}
                  icon={<ReceiptIcon className="h-5 w-5" />}
                  badge={stats.totalVotes > 0
                    ? { text: stats.activeElections > 0 ? "Live count" : "Final", className: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/25" }
                    : { text: "Awaiting", className: "bg-slate-100 text-slate-500 ring-1 ring-slate-500/15" }}
                />
              </section>

              {/* Turnout + Quick actions */}
              <section className="grid gap-6 lg:grid-cols-2">
                {/* Voter turnout */}
                <div className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm sm:p-8" style={{ animationDelay: "400ms" }}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-brand-900">Voter Turnout</h2>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs font-bold ${
                      turnout >= 75 ? "bg-emerald-50 text-emerald-700"
                      : turnout >= 40 ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-500"
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${
                        turnout >= 75 ? "bg-emerald-500" : turnout >= 40 ? "bg-amber-500" : "bg-slate-400"
                      }`} />
                      {stats.activeElections === 0 ? "Paused" : turnout >= 75 ? "Strong" : turnout >= 40 ? "Building" : "Just started"}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center gap-6">
                    <TurnoutRing percentage={turnout} />
                    <div className="min-w-0">
                      {stats.activeElections > 0 ? (
                        <p className="font-sans text-sm font-semibold text-ink-900">
                          ≈ <span className="tabular-nums">{activeVotes}</span> of{" "}
                          <span className="tabular-nums">{stats.totalVoters}</span> voters have voted in
                          the current election.
                        </p>
                      ) : (
                        <p className="font-sans text-sm font-semibold text-ink-900">
                          No election is currently open.
                        </p>
                      )}
                      <p className="mt-1.5 font-sans text-xs text-ink-500">
                        {stats.totalVotes.toLocaleString()} total{" "}
                        {stats.totalVotes === 1 ? "ballot" : "ballots"} cast across all elections.
                      </p>
                      {stats.activeElections > 0 && stats.totalVoters - activeVotes > 0 && (
                        <p className="mt-2 font-sans text-xs text-ink-400">
                          {stats.totalVoters - activeVotes}{" "}
                          {stats.totalVoters - activeVotes === 1 ? "voter hasn't" : "voters haven't"} voted yet —
                          a reminder before closing can lift turnout.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm sm:p-8" style={{ animationDelay: "480ms" }}>
                  <h2 className="text-lg font-bold text-brand-900">Quick Actions</h2>
                  <div className="mt-5 space-y-3">
                    <QuickAction
                      to="/admin/elections" tone="brand" delay={0}
                      icon={<BallotIcon className="h-5 w-5" />}
                      title="Manage Elections"
                      subtitle={`${stats.activeElections} active · ${stats.completedElections} completed`}
                    />
                    <QuickAction
                      to="/admin/voters" tone="amber" delay={60}
                      icon={<UsersIcon className="h-5 w-5" />}
                      title="Manage Voters"
                      subtitle={`${stats.totalVoters} registered voters`}
                    />
                    <QuickAction
                      to="/admin/audit-logs" tone="sky" delay={120}
                      icon={<ScrollIcon className="h-5 w-5" />}
                      title="Audit Logs"
                      subtitle="Review every administrative action"
                    />
                    <QuickAction
                      to="/admin/results" tone="violet" delay={180}
                      icon={<ChartIcon className="h-5 w-5" />}
                      title="Results"
                      subtitle="Live tallies and published outcomes"
                    />
                  </div>
                </div>
              </section>

              {/* Footer note */}
              <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-100/70 p-4 font-sans text-sm text-brand-900">
                <ShieldIcon className="h-5 w-5 shrink-0 text-brand-600" />
                All ballot data is encrypted and anonymized. Administrative actions are permanently recorded in the audit log.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
