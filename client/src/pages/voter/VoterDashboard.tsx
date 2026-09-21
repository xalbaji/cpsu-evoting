import { useCallback, useEffect, useState } from "react";
import type { SVGProps } from "react";
import { Link } from "react-router-dom";

import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

/* ---------------- types ---------------- */
interface Election {
  _id: string;
  title: string;
  description: string;
  course?: string;
  courses?: string[];
  startDate: string;
  endDate: string;
  status: string;
  hasVoted?: boolean; // optional — shows a "Voted" badge if your API sends it
}

type Status = "active" | "upcoming" | "ended";

/* ---------------- helpers ---------------- */
function normalizeStatus(e: Election, now = Date.now()): Status {
  const start = e.startDate ? new Date(e.startDate).getTime() : null;
  const end = e.endDate ? new Date(e.endDate).getTime() : null;
  if (end && now >= end) return "ended";
  if (start && now < start) return "upcoming";

  switch (e.status?.toLowerCase()) {
    case "active":
      return "active";
    case "upcoming":
    case "draft":
      return "upcoming";
    case "ended":
    case "closed":
    case "completed":
    case "results_published":
      return "ended";
  }
  // fallback: derive from dates if status is missing/unknown
  if (start && now < start) return "upcoming";
  if (end && now >= end) return "ended";
  return "active";
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

/* ---------------- icons ---------------- */
type Icon = SVGProps<SVGSVGElement>;
const CalendarIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" />
  </svg>
);
const CheckCircleIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" />
  </svg>
);
const ClockIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);
const ChartIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);
const BoltIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M13 2 4.09 12.35a.5.5 0 0 0 .38.83H11l-1 8 8.91-10.35a.5.5 0 0 0-.38-.83H13l1-8Z" />
  </svg>
);
const ShieldIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const ArrowIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);

/* ---------------- small components ---------------- */
function StatusBadge({ status }: { status: Status }) {
  if (status === "active")
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Active
      </span>
    );
  if (status === "upcoming")
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <ClockIcon className="h-3 w-3" /> Upcoming
      </span>
    );
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-500/10">
      Ended
    </span>
  );
}

const toneStyles: Record<string, string> = {
  emerald: "from-[#0f766e] to-[#0a3d3a]",
  sky:     "from-sky-500 to-indigo-600",
  amber:   "from-amber-500 to-orange-500",
  violet:  "from-violet-500 to-fuchsia-600",
};

const toneShadow: Record<string, string> = {
  emerald: "rgba(15,118,110,0.3)",
  sky:     "rgba(14,165,233,0.3)",
  amber:   "rgba(245,158,11,0.3)",
  violet:  "rgba(139,92,246,0.3)",
};

function StatCard({
  label, value, tone, icon, delay,
}: { label: string; value: number; tone: string; icon: React.ReactNode; delay: number }) {
  return (
    <div
      className="dashboard-stat-card animate-fade-up rounded-2xl bg-white p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        animationDelay: `${delay}ms`,
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white ${toneStyles[tone]}`}
        style={{ boxShadow: `0 4px 12px ${toneShadow[tone]}` }}
      >
        {icon}
      </div>
      <p className="dashboard-stat-value tabular-nums text-4xl font-extrabold" style={{ color: "#052e2c" }}>{value}</p>
      <p className="dashboard-stat-label mt-1 text-sm font-semibold" style={{ color: "#64748b" }}>{label}</p>
    </div>
  );
}

function ElectionCard({ election, index, isVerified }: { election: Election; index: number; isVerified: boolean }) {
  const status = normalizeStatus(election);
  const start = fmtDate(election.startDate);
  const end = fmtDate(election.endDate);
  const courses = election.courses?.length ? election.courses : election.course ? [election.course] : [];

  const accentColor =
    status === "active"   ? "linear-gradient(90deg, #0f766e, #2dd4bf)"
    : status === "upcoming" ? "linear-gradient(90deg, #f59e0b, #f97316)"
    : "#e2e8f0";

  return (
    <article
      className="voter-election-card animate-fade-up group relative flex min-h-[260px] flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1"
      style={{
        animationDelay: `${index * 80}ms`,
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      {/* Top accent stripe */}
      <div style={{ height: 3, background: accentColor, flexShrink: 0 }} />

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3
            className="voter-election-title min-w-0 break-words text-lg font-bold leading-tight transition-colors"
            style={{ color: "#052e2c", margin: 0 }}
          >
            {election.title}
          </h3>
           <StatusBadge status={status} />
         </div>
          {courses.length > 0 && (
            <div className="voter-course-list mb-3 flex flex-wrap gap-1.5">
              {courses.map((course) => <span key={course} className="voter-course-chip inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "#ecfeff", color: "#0e7490" }}>{course}</span>)}
            </div>
          )}
         <p className="voter-election-description mb-5 line-clamp-3 min-h-[3.75rem] text-sm leading-6" style={{ color: "#64748b" }}>
          {election.description || "No description provided."}
        </p>
        <div
          className="voter-election-footer mt-auto flex flex-wrap items-center justify-between gap-3 pt-4"
          style={{ borderTop: "1px solid #f1f5f9" }}
        >
          <span className="voter-election-date inline-flex min-w-0 items-center gap-1.5 text-xs" style={{ color: "#94a3b8" }}>
            <CalendarIcon className="h-4 w-4" />
            {start ? (end ? `${start} – ${end}` : start) : "Dates TBA"}
          </span>

          {status === "active" ? (
            election.hasVoted ? (
              <span
                className="voter-status-pill voter-status-success inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: "#f0fdfb", color: "#0f766e" }}
              >
                <CheckCircleIcon className="h-3.5 w-3.5" /> Voted
              </span>
            ) : !isVerified ? (
              <span
                className="voter-status-pill voter-status-warning inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
                style={{ background: "#fffbeb", color: "#b45309" }}
              >
                Verification required
              </span>
            ) : (
              <Link
                to={`/voter/elections/${election._id}/vote`}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #0f766e, #0a5450)",
                  boxShadow: "0 2px 8px rgba(15,118,110,0.28)",
                }}
              >
                Vote Now <ArrowIcon className="h-4 w-4" />
              </Link>
            )
          ) : status === "upcoming" ? (
            <span
              className="voter-status-pill voter-status-warning inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
              style={{ background: "#fffbeb", color: "#b45309" }}
            >
              <ClockIcon className="h-3.5 w-3.5" /> Opens soon
            </span>
          ) : (
            <Link
              to={`/voter/elections/${election._id}/results`}
              className="voter-results-link text-sm font-semibold hover:underline"
              style={{ color: "#0f766e" }}
            >
              View results
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="h-48 skeleton" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 skeleton" />
        ))}
      </div>
      <div className="h-64 skeleton" />
    </div>
  );
}

/* ---------------- page ---------------- */
export default function VoterDashboard() {
  const { user } = useAuth();

  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const response = await api.get("/elections");
      setElections(response.data.data ?? []);
    } catch {
      setError("Unable to load elections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error)
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-danger-50 bg-danger-50 p-8 text-center">
        <p role="alert" className="font-semibold text-danger-700">{error}</p>
        <button
          onClick={load}
          className="mt-4 rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-95"
        >
          Try again
        </button>
      </div>
    );

  if (loading) return <Skeleton />;

  const moderatorCourse = user?.course?.trim().toUpperCase();
  const visibleElections = user?.role === "ADMIN"
    ? moderatorCourse
      ? elections.filter((election) => {
          const courses = election.courses?.length ? election.courses : election.course ? [election.course] : [];
          return courses.some((course) => course.toUpperCase() === moderatorCourse);
        })
      : []
    : elections;
  const active = visibleElections.filter((e) => normalizeStatus(e, currentTime) === "active");
  const upcoming = visibleElections.filter((e) => normalizeStatus(e, currentTime) === "upcoming");
  const ended = visibleElections.filter((e) => normalizeStatus(e, currentTime) === "ended");
  const firstName = user?.firstName ?? "Voter";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const stats = [
    { label: "Active now", value: active.length, tone: "emerald", icon: <BoltIcon className="h-5 w-5" /> },
    { label: "Upcoming", value: upcoming.length, tone: "amber", icon: <ClockIcon className="h-5 w-5" /> },
    { label: "Completed", value: ended.length, tone: "sky", icon: <CheckCircleIcon className="h-5 w-5" /> },
    { label: "Total elections", value: visibleElections.length, tone: "violet", icon: <ChartIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="voter-dashboard space-y-8">
      {/* Hero */}
      <section
        className="voter-dashboard-hero animate-fade-up relative overflow-hidden rounded-3xl p-8 text-white sm:p-10"
        style={{
          background: "linear-gradient(135deg, #052e2c 0%, #0a3d3a 45%, #0f766e 100%)",
          boxShadow: "0 8px 32px rgba(5,46,44,0.28)",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl" style={{ background: "rgba(45,212,191,0.12)" }} />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,0.05)" }} />

        <p style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5eead4", margin: 0 }}>
          {greeting()},
        </p>
        <h1 className="mt-2 font-extrabold capitalize" style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", margin: "0.5rem 0 0" }}>
          {firstName} <span className="animate-wave inline-block">👋</span>
        </h1>
        <p style={{ marginTop: "0.75rem", maxWidth: 520, color: "rgba(204,251,241,0.85)", fontSize: "0.9rem", marginBottom: 0 }}>
           Your voice shapes CPSU. Review the elections assigned to {user?.course ?? "your course"} below and make your vote count.
        </p>
        <div className="mt-5 flex flex-wrap gap-2" style={{ fontSize: "0.75rem", fontWeight: 500 }}>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <CalendarIcon className="h-3.5 w-3.5" /> {today}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <ShieldIcon className="h-3.5 w-3.5" /> Secure · Anonymous · Encrypted
          </span>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={100 + i * 80} />
        ))}
      </section>

      {/* Active elections */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="voter-section-title text-xl font-bold" style={{ color: "#052e2c", margin: 0 }}>Active Elections</h2>
          <span
            className="voter-section-count rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{ background: "#d1fae5", color: "#065f46" }}
          >
            {active.length}
          </span>
        </div>

        {!user?.isVerified && active.length > 0 && (
          <div
            className="voter-alert-warning mb-5 flex items-start gap-3 rounded-2xl p-4 text-sm"
            style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}
          >
            <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#d97706" }} />
            <p className="m-0">
              Your account is awaiting verification. An administrator must verify your account before you can cast a ballot.
            </p>
          </div>
        )}

        {active.length === 0 ? (
          <div
            className="voter-empty-state animate-fade-up rounded-2xl p-12 text-center"
            style={{ border: "2px dashed #e2e8f0", background: "#f8fafc" }}
          >
            <ShieldIcon className="mx-auto h-12 w-12" style={{ color: "#99f6e4" }} />
            <h3 className="voter-empty-title mt-4 font-bold" style={{ color: "#0f766e" }}>No active elections right now</h3>
            <p className="voter-empty-description mt-1 text-sm" style={{ color: "#64748b" }}>
              New {user?.course ? `${user.course} ` : "course-based "}elections will appear here the moment they open.
            </p>
          </div>
        ) : (
          <div className={`voter-election-grid ${active.length === 1 ? "is-single" : ""}`}>
            {active.map((election, i) => (
              <ElectionCard key={election._id} election={election} index={i} isVerified={Boolean(user?.isVerified)} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="voter-section-title text-xl font-bold" style={{ color: "#052e2c", margin: 0 }}>Coming Up</h2>
            <span
              className="voter-section-count rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ background: "#fef3c7", color: "#92400e" }}
            >
              {upcoming.length}
            </span>
          </div>
          <div
            className="voter-list-card animate-fade-up divide-y rounded-2xl bg-white"
            style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            {upcoming.map((election) => (
              <div key={election._id} className="flex items-center justify-between gap-4 p-4 transition" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <p className="font-semibold" style={{ color: "#052e2c", margin: 0 }}>{election.title}</p>
                  <p className="text-xs" style={{ color: "#64748b", margin: "2px 0 0" }}>
                    Opens {election.startDate ? fmtDate(election.startDate) : "soon"}
                  </p>
                </div>
                <ClockIcon className="h-5 w-5 shrink-0" style={{ color: "#f59e0b" }} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {ended.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="voter-section-title text-xl font-bold" style={{ color: "#052e2c", margin: 0 }}>Past Elections</h2>
            <span
              className="voter-section-count rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ background: "#f1f5f9", color: "#64748b" }}
            >
              {ended.length}
            </span>
          </div>
          <div
            className="voter-list-card animate-fade-up rounded-2xl bg-white"
            style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            {ended.map((election, idx) => (
              <div
                key={election._id}
                className="flex items-center justify-between gap-4 p-4 transition"
                style={{ borderBottom: idx < ended.length - 1 ? "1px solid #f1f5f9" : "none" }}
              >
                <div>
                  <p className="font-semibold" style={{ color: "#052e2c", margin: 0 }}>{election.title}</p>
                  <p className="text-xs" style={{ color: "#64748b", margin: "2px 0 0" }}>
                    Ended {election.endDate ? fmtDate(election.endDate) : "—"}
                  </p>
                </div>
                <Link
                  to={`/voter/elections/${election._id}/results`}
                  className="shrink-0 text-sm font-semibold hover:underline"
                  style={{ color: "#0f766e" }}
                >
                  View results
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trust banner */}
      <div
        className="voter-trust-banner flex items-center gap-3 rounded-2xl p-4 text-sm"
        style={{
          border: "1px solid #ccfbf1",
          background: "linear-gradient(135deg, #f0fdfb, #f8fafc)",
          color: "#0a3d3a",
        }}
      >
        <ShieldIcon className="h-5 w-5 shrink-0" style={{ color: "#0f766e" }} />
        <span className="min-w-0 flex-1 leading-5">
          Your ballot is encrypted and anonymous — even administrators can't link your identity to your vote.
        </span>
      </div>
    </div>
  );
}
