import { useCallback, useEffect, useMemo, useState } from "react";
import type { SVGProps } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { api } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";

/* ---------------- types (matches getAuditLogs) ---------------- */
interface AuditActor {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface AuditLog {
  _id: string;
  action: string;      // e.g. ELECTION_CREATED
  resource: string;    // e.g. Election
  resourceId?: string;
  description?: string;
  ipAddress?: string;
  createdAt: string;
  userId?: AuditActor | null; // populated: firstName lastName email
}

/* ---------------- helpers ---------------- */
function actorOf(log: AuditLog): { name: string; email?: string } | null {
  const u = log.userId;
  if (u && typeof u === "object" && (u.firstName || u.lastName || u.email)) {
    return {
      name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "Unknown",
      email: u.email,
    };
  }
  return null;
}

const fmtFull = (d: string) =>
  new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });

function TimeAgo({ date }: { date: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  const label =
    seconds < 60 ? "just now"
    : seconds < 3600 ? `${Math.floor(seconds / 60)}m ago`
    : seconds < 86400 ? `${Math.floor(seconds / 3600)}h ago`
    : `${Math.floor(seconds / 86400)}d ago`;
  return <>{label}</>;
}

type Tone = "brand" | "sky" | "amber" | "red" | "violet" | "slate";

const TONE_BADGE: Record<Tone, string> = {
  brand:  "bg-brand-50 text-brand-700 ring-1 ring-brand-500/25",
  sky:    "bg-sky-50 text-sky-700 ring-1 ring-sky-600/25",
  amber:  "bg-amber-50 text-amber-700 ring-1 ring-amber-600/25",
  red:    "bg-danger-50 text-danger-700 ring-1 ring-danger-700/20",
  violet: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/25",
  slate:  "bg-slate-100 text-slate-600 ring-1 ring-slate-500/15",
};

const TONE_DOT: Record<Tone, string> = {
  brand:  "bg-brand-500",
  sky:    "bg-sky-500",
  amber:  "bg-amber-500",
  red:    "bg-red-500",
  violet: "bg-violet-500",
  slate:  "bg-slate-400",
};

function actionTone(action: string): Tone {
  const a = action.toUpperCase();
  if (a.includes("DELETE") || a.includes("CANCEL")) return "red";
  if (a.includes("PUBLISH")) return "amber";
  if (a.includes("UPDATE")) return "sky";
  if (a.includes("CREATE") || a.includes("OPEN")) return "brand";
  if (a.includes("LOGIN") || a.includes("AUTH") || a.includes("LOGOUT")) return "violet";
  return "slate";
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
const SearchIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
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
const ReceiptIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 3h14v18l-2.33-1.5L14.33 21 12 19.5 9.67 21l-2.34-1.5L5 21V3Z" /><path d="M9 8h6M9 12h6" />
  </svg>
);
const LockIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const CubeIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m12 2 8 4.5v11L12 22l-8-4.5v-11L12 2Z" /><path d="m4 6.5 8 4.5 8-4.5M12 11v11" />
  </svg>
);

function resourceIcon(resource: string): React.ReactNode {
  const r = resource.toLowerCase();
  if (r.includes("election")) return <ShieldIcon className="h-3.5 w-3.5" />;
  if (r.includes("user") || r.includes("voter")) return <UsersIcon className="h-3.5 w-3.5" />;
  if (r.includes("vote")) return <ReceiptIcon className="h-3.5 w-3.5" />;
  if (r.includes("result")) return <ChartIcon className="h-3.5 w-3.5" />;
  if (r.includes("auth") || r.includes("session")) return <LockIcon className="h-3.5 w-3.5" />;
  return <CubeIcon className="h-3.5 w-3.5" />;
}

/* ---------------- nav (same as other admin pages) ---------------- */
const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: GridIcon },
  { path: "/admin/elections", label: "Elections", icon: ShieldIcon },
  { path: "/admin/voters", label: "Voters", icon: UsersIcon },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: ScrollIcon },
  { path: "/admin/results", label: "Results", icon: ChartIcon },
];

/* ---------------- small components ---------------- */
function MiniStat({ label, value, delay }: {
  label: string; value: string | number; delay: number;
}) {
  return (
    <div
      className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-2xl font-extrabold tabular-nums text-brand-900">{value}</p>
      <p className="mt-0.5 font-sans text-sm font-medium text-ink-500">{label}</p>
    </div>
  );
}

function TimelineEntry({ log, index }: { log: AuditLog; index: number }) {
  const tone = actionTone(log.action);
  const actor = actorOf(log);

  return (
    <li
      className="animate-fade-up relative pl-10"
      style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
    >
      {/* timeline rail + dot */}
      <span className="absolute left-[13px] top-0 h-full w-px bg-brand-200" aria-hidden />
      <span
        className={`absolute left-1.5 top-5 grid h-6 w-6 place-items-center rounded-full text-white shadow-md ${TONE_DOT[tone]}`}
        aria-hidden
      >
        {resourceIcon(log.resource)}
      </span>

      <div className="rounded-2xl border border-brand-200 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:border-brand-500/40 hover:shadow-md sm:p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`rounded-md px-2 py-1 font-mono text-[11px] font-bold tracking-wide ${TONE_BADGE[tone]}`}>
            {log.action}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-sans text-[11px] font-bold text-slate-600 ring-1 ring-slate-500/15">
            {log.resource}
          </span>
          <span className="ml-auto font-sans text-xs text-ink-400">
            <TimeAgo date={log.createdAt} />
          </span>
        </div>

        {log.description && (
          <p className="mt-2 font-sans text-sm font-semibold text-ink-900">{log.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-ink-500">
          {actor && (
            <span>
              by <strong className="font-bold text-ink-700">{actor.name}</strong>
              {actor.email && <span className="text-ink-400"> · {actor.email}</span>}
            </span>
          )}
          <span>{fmtFull(log.createdAt)}</span>
          {log.ipAddress && (
            <span className="font-mono text-[11px] text-ink-400">IP {log.ipAddress}</span>
          )}
        </div>
      </div>
    </li>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-40 animate-pulse rounded-3xl bg-brand-200/70" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-brand-200/70" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-brand-200/70" />
    </div>
  );
}

/* ---------------- page ---------------- */
export default function AuditLogs() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [search, setSearch] = useState("");          // committed
  const [searchInput, setSearchInput] = useState(""); // typing
  const [category, setCategory] = useState<"all" | Tone>("all");
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useCallback(async (opts?: { search?: string }) => {
    setError("");
    try {
      const s = opts?.search ?? search;
      // ✅ GET /audit?search= — getAuditLogs (server filters + sorts, caps at 200)
      const response = await api.get("/audit-logs", {
        params: s.trim() ? { search: s.trim() } : {},
      });
      setLogs(response.data?.data ?? []);
    } catch {
      setError("Unable to load audit logs.");
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput);
    load({ search: searchInput });
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setCategory("all");
    load({ search: "" });
  };

  /* client-side category filter — free, since the server sends up to 200 at once */
  const filtered = useMemo(() => {
    if (category === "all") return logs ?? [];
    return (logs ?? []).filter((l) => actionTone(l.action) === category);
  }, [logs, category]);

  const total = logs?.length ?? 0;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayCount = (logs ?? []).filter((l) => new Date(l.createdAt) >= startOfDay).length;
  const uniqueActions = new Set((logs ?? []).map((l) => l.action)).size;
  const latest = logs?.[0]?.createdAt;
  const atCap = total >= 200;

  const categories: { key: "all" | Tone; label: string }[] = [
    { key: "all", label: "All" },
    { key: "brand", label: "Created / Opened" },
    { key: "sky", label: "Updated" },
    { key: "amber", label: "Published" },
    { key: "red", label: "Deleted / Cancelled" },
    { key: "violet", label: "Authentication" },
  ];

  const countFor = (key: "all" | Tone) =>
    key === "all"
      ? total
      : (logs ?? []).filter((l) => actionTone(l.action) === key).length;

  return (
    <div className="min-h-screen bg-brand-50 font-serif text-ink-900">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 bg-brand-900 px-4 font-sans text-white shadow-md lg:px-6">
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
          <span className="hidden text-[1.05rem] font-semibold tracking-wide sm:block">CPSU E-Voting</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-brand-300">CPSU Administrator</span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20 active:scale-95"
          >
            Log out
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-16 z-40 w-64 border-r border-brand-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
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
      </aside>

      {/* ── Main ── */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
          {error ? (
            <div className="mx-auto mt-10 max-w-md rounded-2xl border border-danger-50 bg-danger-50 p-8 text-center ring-1 ring-danger-700/10">
              <p role="alert" className="font-sans font-semibold text-danger-700">{error}</p>
              <button onClick={() => load()} className="mt-4 active:scale-95">Try again</button>
            </div>
          ) : !logs ? (
            <Skeleton />
          ) : (
            <div className="space-y-6">
              {/* Hero */}
              <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
                  Track administrative actions and system activity
                </p>
                <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Audit Logs</h1>
                <p className="mt-3 max-w-xl font-sans text-brand-100/90">
                  {total > 0
                    ? `${total.toLocaleString()} ${total === 1 ? "event" : "events"} on record${atCap ? " (showing the 200 most recent)" : ""}. Every create, update, publish, and delete is permanently recorded — entries cannot be edited or removed.`
                    : "Administrative actions will be recorded here automatically as they happen."}
                </p>
              </section>

              {/* Stats */}
              <section className="grid gap-4 sm:grid-cols-3">
                <MiniStat label="Events loaded" value={total.toLocaleString()} delay={80} />
                <MiniStat label="Today" value={todayCount} delay={160} />
                <MiniStat
                  label="Latest activity"
                  value={latest ? <TimeAgo date={latest} /> : "—"}
                  delay={240}
                />
              </section>

              {/* Search */}
              <section className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm">
                <form onSubmit={submitSearch} className="flex flex-wrap gap-3">
                  <div className="relative min-w-0 flex-1">
                    <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
                    <input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search by action, resource, or description…"
                      className="rounded-xl py-2.5 pl-11"
                    />
                  </div>
                  <button type="submit" className="active:scale-95">Search</button>
                  {search && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="!bg-white !px-4 !text-ink-700 ring-1 ring-brand-300 hover:!bg-brand-50 active:scale-95"
                    >
                      Clear
                    </button>
                  )}
                </form>

                {/* category chips (client-side filter) */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const active = category === c.key;
                    const count = countFor(c.key);
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setCategory(c.key)}
                        className={`rounded-full px-3 py-1.5 font-sans text-xs font-bold transition active:scale-95 ${
                          active
                            ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                            : "bg-brand-50 text-ink-600 ring-1 ring-brand-200 hover:bg-brand-100"
                        }`}
                      >
                        {c.label}
                        <span className={`ml-1.5 ${active ? "text-white/80" : "text-ink-400"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Timeline */}
              <section className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-brand-900">
                    {search ? `Results for “${search}”` : "Activity Log"}
                  </h2>
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 font-sans text-xs font-bold text-brand-700">
                    {filtered.length}
                  </span>
                  {uniqueActions > 0 && (
                    <span className="ml-auto font-sans text-xs text-ink-400">
                      {uniqueActions} distinct {uniqueActions === 1 ? "action" : "action types"}
                    </span>
                  )}
                </div>

                {filtered.length === 0 ? (
                  <div className="mt-6 rounded-2xl border-2 border-dashed border-brand-200 bg-white/60 p-12 text-center">
                    <ScrollIcon className="mx-auto h-12 w-12 text-brand-300" />
                    <h3 className="mt-4 font-bold text-brand-900">
                      {search || category !== "all"
                        ? "No events match your filters"
                        : "No activity recorded yet"}
                    </h3>
                    <p className="mt-1 font-sans text-sm text-ink-500">
                      {search || category !== "all"
                        ? "Try a different search term or category."
                        : "Actions like creating or publishing an election will appear here."}
                    </p>
                  </div>
                ) : (
                  <ul className="mt-6 space-y-4">
                    {filtered.map((log, i) => (
                      <TimelineEntry key={log._id} log={log} index={i} />
                    ))}
                  </ul>
                )}
              </section>

              {/* Footer note */}
              <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-100/70 p-4 font-sans text-sm text-brand-900">
                <ScrollIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <span>
                  <strong>Immutability:</strong> audit entries are append-only. Color coding — green: created/opened,
                  blue: updated, gold: published, red: deleted/cancelled, violet: authentication events.
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}