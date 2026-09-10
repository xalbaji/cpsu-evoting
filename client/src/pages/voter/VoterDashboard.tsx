import { useCallback, useEffect, useState } from "react";
import type { SVGProps } from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

/* ---------------- types ---------------- */
interface Election {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  hasVoted?: boolean; // optional — shows a "Voted" badge if your API sends it
}

type Status = "active" | "upcoming" | "ended";

/* ---------------- helpers ---------------- */
function normalizeStatus(e: Election): Status {
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
  const now = Date.now();
  const start = e.startDate ? new Date(e.startDate).getTime() : null;
  const end = e.endDate ? new Date(e.endDate).getTime() : null;
  if (start && now < start) return "upcoming";
  if (end && now > end) return "ended";
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
  emerald: "from-brand-500 to-brand-700 shadow-brand-500/30",
  sky: "from-sky-500 to-indigo-500 shadow-sky-200",
  amber: "from-amber-500 to-orange-500 shadow-amber-200",
  violet: "from-violet-500 to-fuchsia-500 shadow-violet-200",
};

function StatCard({
  label, value, tone, icon, delay,
}: { label: string; value: number; tone: string; icon: React.ReactNode; delay: number }) {
  return (
    <div
      className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${toneStyles[tone]}`}>
        {icon}
      </div>
      <p className="text-3xl font-extrabold text-brand-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-500">{label}</p>
    </div>
  );
}

function ElectionCard({ election, index, isVerified }: { election: Election; index: number; isVerified: boolean }) {
  const status = normalizeStatus(election);
  const start = fmtDate(election.startDate);
  const end = fmtDate(election.endDate);

  return (
    <article
      className="animate-fade-up group relative flex min-h-[260px] flex-col overflow-hidden rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${
        status === "active" ? "bg-gradient-to-r from-brand-500 to-brand-700"
        : status === "upcoming" ? "bg-gradient-to-r from-amber-400 to-orange-400"
        : "bg-brand-300"}`}
      />
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-lg font-bold leading-tight text-brand-900 transition-colors group-hover:text-brand-700">
          {election.title}
        </h3>
        <StatusBadge status={status} />
      </div>
      <p className="mb-5 line-clamp-3 min-h-[3.75rem] text-sm leading-6 text-ink-500">
        {election.description || "No description provided."}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-brand-200 pt-4">
        <span className="inline-flex min-w-0 items-start gap-1.5 text-xs leading-5 text-ink-500">
          <CalendarIcon className="h-4 w-4" />
          {start ? (end ? `${start} – ${end}` : start) : "Dates TBA"}
        </span>

        {status === "active" ? (
          election.hasVoted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
              <CheckCircleIcon className="h-3.5 w-3.5" /> Voted
            </span>
          ) : !isVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Verification required
            </span>
          ) : (
            <Link
              to={`/voter/elections/${election._id}/vote`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:brightness-110 active:scale-95"
            >
              Vote Now <ArrowIcon className="h-4 w-4" />
            </Link>
          )
        ) : status === "upcoming" ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            <ClockIcon className="h-3.5 w-3.5" /> Opens soon
          </span>
        ) : (
          <Link to={`/voter/elections/${election._id}/results`} className="text-sm font-semibold text-brand-700 hover:underline">
            View results
          </Link>
        )}
      </div>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="h-48 animate-pulse rounded-3xl bg-brand-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-brand-200/70" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-brand-200/70" />
    </div>
  );
}

/* ---------------- page ---------------- */
export default function VoterDashboard() {
  const { user } = useAuth();

  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const active = elections.filter((e) => normalizeStatus(e) === "active");
  const upcoming = elections.filter((e) => normalizeStatus(e) === "upcoming");
  const ended = elections.filter((e) => normalizeStatus(e) === "ended");
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
    { label: "Total elections", value: elections.length, tone: "violet", icon: <ChartIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-xl shadow-brand-900/20 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />

        <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
          {greeting()},
        </p>
        <h1 className="mt-1 text-3xl font-extrabold capitalize sm:text-4xl">
          {firstName} <span className="animate-wave inline-block">👋</span>
        </h1>
        <p className="mt-3 max-w-xl font-sans text-brand-100/90">
          Your voice shapes CPSU. Review the open elections below and make your vote count.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-inset ring-white/20">
            <CalendarIcon className="h-3.5 w-3.5" /> {today}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-inset ring-white/20">
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
          <h2 className="text-xl font-bold text-brand-900">Active Elections</h2>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            {active.length}
          </span>
        </div>

        {!user?.isVerified && active.length > 0 && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-sans text-sm text-amber-900">
            <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="m-0">
              Your account is awaiting verification. An administrator must verify your account before you can cast a ballot.
            </p>
          </div>
        )}

        {active.length === 0 ? (
          <div className="animate-fade-up rounded-2xl border-2 border-dashed border-brand-200 bg-white/60 p-12 text-center">
            <ShieldIcon className="mx-auto h-12 w-12 text-brand-300" />
            <h3 className="mt-4 font-bold text-brand-700">No active elections right now</h3>
            <p className="mt-1 text-sm text-ink-500">
              New elections will appear here the moment they open.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
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
            <h2 className="text-xl font-bold text-brand-900">Coming Up</h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              {upcoming.length}
            </span>
          </div>
          <div className="animate-fade-up divide-y divide-brand-200 rounded-2xl border border-brand-200 bg-white shadow-sm">
            {upcoming.map((election) => (
              <div key={election._id} className="flex items-center justify-between gap-4 p-4 transition hover:bg-brand-50">
                <div>
                  <p className="font-semibold text-brand-900">{election.title}</p>
                  <p className="text-xs text-ink-500">
                    Opens {election.startDate ? fmtDate(election.startDate) : "soon"}
                  </p>
                </div>
                <ClockIcon className="h-5 w-5 shrink-0 text-amber-500" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {ended.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-xl font-bold text-brand-900">Past Elections</h2>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {ended.length}
            </span>
          </div>
          <div className="animate-fade-up divide-y divide-brand-200 rounded-2xl border border-brand-200 bg-white shadow-sm">
            {ended.map((election) => (
              <div key={election._id} className="flex items-center justify-between gap-4 p-4 transition hover:bg-brand-50">
                <div>
                  <p className="font-semibold text-brand-900">{election.title}</p>
                  <p className="text-xs text-ink-500">
                    Ended {election.endDate ? fmtDate(election.endDate) : "—"}
                  </p>
                </div>
                <Link to={`/voter/elections/${election._id}/results`} className="shrink-0 text-sm font-semibold text-brand-700 hover:underline">
                  View results
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trust banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-100/60 p-4 text-sm text-brand-900">
        <ShieldIcon className="h-5 w-5 shrink-0 text-brand-600" />
        <span className="min-w-0 flex-1 leading-5">
          Your ballot is encrypted and anonymous — even administrators can't link your identity to your vote.
        </span>
      </div>
    </div>
  );
}
