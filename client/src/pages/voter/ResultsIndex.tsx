import { useCallback, useEffect, useMemo, useState } from "react";
import type { SVGProps } from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/axios";

/* ---------------- types ---------------- */
interface Election {
  _id: string;
  title: string;
  description?: string;
  academicYear?: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

/* ---------------- helpers ---------------- */
const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

/* ---------------- icons ---------------- */
type Icon = SVGProps<SVGSVGElement>;
const TrophyIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4a1 1 0 0 0-1 1c0 2.5 1.8 4 4 4M17 6h3a1 1 0 0 1 1 1c0 2.5-1.8 4-4 4" />
  </svg>
);
const CheckIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);
const CalendarIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" />
  </svg>
);
const LayersIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" />
  </svg>
);
const SearchIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
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
const toneStyles: Record<string, string> = {
  amber: "from-amber-500 to-orange-500",
  brand: "from-brand-500 to-brand-700",
  sky:   "from-sky-500 to-indigo-500",
};

function StatCard({ label, value, tone, icon, delay }: {
  label: string; value: string | number; tone: string; icon: React.ReactNode; delay: number;
}) {
  return (
    <div
      className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg ${toneStyles[tone]}`}>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-brand-900">{value}</p>
      <p className="mt-0.5 font-sans text-sm font-medium text-ink-500">{label}</p>
    </div>
  );
}

function ElectionCard({
  election, voted, index,
}: { election: Election; voted: boolean; index: number }) {
  return (
    <article
      className="animate-fade-up group relative overflow-hidden rounded-2xl border border-brand-200 bg-white/90 p-6 pl-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-amber-400 to-orange-500" />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white sm:grid">
            <TrophyIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-brand-900 transition-colors group-hover:text-brand-700">
              {election.title}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-ink-500">
              {election.academicYear && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" /> Academic year: {election.academicYear}
                </span>
              )}
              {(election.startDate || election.endDate) && (
                <span>
                  {fmtDate(election.startDate) ?? "—"} – {fmtDate(election.endDate) ?? "—"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {voted && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 font-sans text-xs font-bold text-brand-700 ring-1 ring-brand-500/25">
              <CheckIcon className="h-3 w-3" /> You voted
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-sans text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/25">
            <CheckIcon className="h-3 w-3" /> Final
          </span>
          <Link
            to={`/voter/elections/${election._id}/results`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-brand-500 to-brand-700 px-4 py-2 font-sans text-sm font-bold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40 hover:brightness-110 active:scale-95"
          >
            View results <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="h-44 animate-pulse rounded-3xl bg-brand-200/70" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-brand-200/70" />
        ))}
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-brand-200/70" />
      ))}
    </div>
  );
}

/* ---------------- page ---------------- */
export default function ResultsIndex() {
  const [elections, setElections] = useState<Election[]>([]);
  const [myElectionIds, setMyElectionIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      /* ✅ your real endpoint — filter published client-side like your original */
      const response = await api.get("/elections");
      const all: Election[] = response.data?.data ?? [];
      setElections(
        all.filter((e) => e.status?.toUpperCase() === "RESULTS_PUBLISHED"),
      );
    } catch {
      setError("Unable to load published results.");
    } finally {
      setLoading(false);
    }

    // optional cross-reference for "You voted" badges — never blocks the page
    try {
      const res = await api.get("/votes/my-status");
      const votes = res.data?.data ?? [];
      setMyElectionIds(
        new Set(
          votes
            .map((v: any) => v?.electionId?._id?.toString?.() ?? v?.electionId?.toString?.())
            .filter(Boolean),
        ),
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? elections.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            (e.academicYear ?? "").toLowerCase().includes(q),
        )
      : elections;
    return [...list].sort((a, b) =>
      (b.academicYear ?? "").localeCompare(a.academicYear ?? ""),
    );
  }, [elections, query]);

  if (error)
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-danger-50 bg-danger-50 p-8 text-center ring-1 ring-danger-700/10">
        <p role="alert" className="font-sans font-semibold text-danger-700">{error}</p>
        <button onClick={load} className="mt-4 active:scale-95">Try again</button>
      </div>
    );

  if (loading) return <Skeleton />;

  const participated = elections.filter((e) => myElectionIds.has(e._id)).length;
  const years = new Set(elections.map((e) => e.academicYear).filter(Boolean)).size;

  const stats = [
    { label: "Results published", value: elections.length, tone: "amber", icon: <TrophyIcon className="h-5 w-5" /> },
    { label: "You voted in", value: `${participated} of ${elections.length}`, tone: "brand", icon: <CheckIcon className="h-5 w-5" /> },
    { label: "Academic years", value: years, tone: "sky", icon: <LayersIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-xl sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
          Official tallies
        </p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Published Results</h1>
        <p className="mt-3 max-w-xl font-sans text-brand-100/90">
          {elections.length > 0
            ? "Final, verified tallies from concluded elections — winners, vote counts, and live position breakdowns."
            : "When an election concludes and admins publish its results, the official tallies will appear here."}
        </p>
        <div className="mt-6 flex flex-wrap gap-2 font-sans text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
            <ShieldIcon className="h-3.5 w-3.5" /> Verified & tamper-proof
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
            <TrophyIcon className="h-3.5 w-3.5" /> Open to all students
          </span>
        </div>
      </section>

      {/* Stats */}
      {elections.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} delay={100 + i * 80} />
          ))}
        </section>
      )}

      {/* Search */}
      {elections.length > 3 && (
        <div className="animate-fade-up relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by election name or academic year…"
            className="rounded-xl py-3 pl-11 font-sans"
          />
        </div>
      )}

      {/* List */}
      <section className="space-y-4">
        {elections.length === 0 ? (
          <div className="animate-fade-up rounded-2xl border-2 border-dashed border-brand-200 bg-white/60 p-14 text-center">
            <TrophyIcon className="mx-auto h-12 w-12 text-brand-300" />
            <h3 className="mt-4 font-bold text-brand-900">No published results yet</h3>
            <p className="mt-1 font-sans text-sm text-ink-500">
              Tallies appear here once an election ends and admins publish the results.
            </p>
            <Link to="/voter/dashboard" className="mt-5 inline-flex items-center gap-1.5">
              Back to dashboard <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="animate-fade-up rounded-2xl border-2 border-dashed border-brand-200 bg-white/60 p-10 text-center">
            <p className="font-sans font-semibold text-ink-600">No results match “{query}”.</p>
            <button type="button" onClick={() => setQuery("")} className="mt-3 !bg-brand-100 !py-2 !text-brand-700">
              Clear search
            </button>
          </div>
        ) : (
          filtered.map((election, i) => (
            <ElectionCard
              key={election._id}
              election={election}
              voted={myElectionIds.has(election._id)}
              index={i}
            />
          ))
        )}
      </section>

      {/* Trust banner */}
      {elections.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-100/70 p-4 font-sans text-sm text-brand-900">
          <ShieldIcon className="h-5 w-5 shrink-0 text-brand-600" />
          <span className="min-w-0 flex-1 leading-5">
            Results are computed directly from ballot records and are final once published — no manual edits, no surprises.
          </span>
        </div>
      )}
    </div>
  );
}
