import { useCallback, useEffect, useMemo, useState } from "react";
import type { SVGProps } from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/axios";

/* ---------------- types (matches getMyVoteStatus) ---------------- */
interface PopulatedElection {
  _id: string;
  title: string;
  status: string;
  startDate?: string; // available if you extend the populate (see controller note)
  endDate?: string;
}

interface MyVote {
  _id: string;
  voteReference: string;
  submittedAt: string;
  electionId: PopulatedElection | null;
}

type ElectionStatus = "active" | "upcoming" | "ended";

/* ---------------- helpers ---------------- */
function electionStatus(e?: PopulatedElection | null): ElectionStatus {
  if (!e) return "ended";
  switch (e.status?.toUpperCase()) {
    case "ACTIVE": return "active";
    case "UPCOMING":
    case "DRAFT": return "upcoming";
    case "RESULTS_PUBLISHED":
    case "ENDED":
    case "CLOSED":
    case "COMPLETED": return "ended";
  }
  // fallback: derive from dates if present
  const now = Date.now();
  if (e.startDate && now < new Date(e.startDate).getTime()) return "upcoming";
  if (e.endDate && now > new Date(e.endDate).getTime()) return "ended";
  return "active";
}

const fmtDateTime = (d?: string) =>
  d ? new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

/* ---------------- icons ---------------- */
type Icon = SVGProps<SVGSVGElement>;
const ReceiptIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 3h14v18l-2.33-1.5L14.33 21 12 19.5 9.67 21l-2.34-1.5L5 21V3Z" /><path d="M9 8h6M9 12h6" />
  </svg>
);
const CheckIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);
const CopyIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const CalendarIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" />
  </svg>
);
const ClockIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
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
const LayersIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" />
  </svg>
);

/* ---------------- copy hook ---------------- */
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, []);
  return { copied, copy };
}

/* ---------------- small components ---------------- */
const toneStyles: Record<string, string> = {
  brand:  "from-brand-500 to-brand-700",
  sky:    "from-sky-500 to-indigo-500",
  violet: "from-violet-500 to-fuchsia-500",
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

function ElectionStatusBadge({ status }: { status: ElectionStatus }) {
  if (status === "active")
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-sans text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/25">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Election open
      </span>
    );
  if (status === "upcoming")
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 font-sans text-xs font-bold text-amber-700 ring-1 ring-amber-600/25">
        <ClockIcon className="h-3 w-3" /> Upcoming
      </span>
    );
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2.5 py-1 font-sans text-xs font-bold text-slate-500 ring-1 ring-slate-500/15">
      Election closed
    </span>
  );
}

function VoteCard({ vote, index }: { vote: MyVote; index: number }) {
  const { copied, copy } = useCopy();
  const election = vote.electionId;
  const status = electionStatus(election);

  return (
    <article
      className="animate-fade-up group relative overflow-hidden rounded-2xl border border-brand-200 bg-white/90 p-6 pl-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* left accent bar */}
      <div className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-brand-500 to-brand-700" />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* left: receipt identity */}
        <div className="flex min-w-0 items-start gap-4">
          <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700 transition-colors group-hover:bg-brand-500 group-hover:text-white sm:grid">
            <ReceiptIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-brand-900 transition-colors group-hover:text-brand-700">
              {election?.title ?? "Deleted election"}
            </h3>
            <p className="mt-1 inline-flex items-center gap-1.5 font-sans text-xs text-ink-500">
              <CalendarIcon className="h-3.5 w-3.5" />
              Cast on {fmtDateTime(vote.submittedAt)}
            </p>
          </div>
        </div>

        {/* right: reference + badges + results */}
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <button
            type="button"
            onClick={() => copy(vote.voteReference)}
            title="Copy reference code"
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xs font-semibold transition active:scale-95 ${
              copied
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-brand-200 bg-brand-50 text-ink-700 hover:border-brand-500 hover:text-brand-700"
            }`}
          >
            {vote.voteReference}
            {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
          </button>

          {/* your personal status — always green: the vote was counted */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 font-sans text-xs font-bold text-brand-700 ring-1 ring-brand-500/25">
            <CheckIcon className="h-3 w-3" /> Voted
          </span>

          {/* the election's current status */}
          <ElectionStatusBadge status={status} />

          {election && (
            <Link
              to={`/voter/elections/${election._id}/results`}
              className="inline-flex items-center gap-1 font-sans text-sm font-bold text-brand-600 hover:underline"
            >
              Results <ArrowIcon className="h-4 w-4" />
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
      <div className="h-44 animate-pulse rounded-3xl bg-brand-200/70" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-brand-200/70" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-brand-200/70" />
      ))}
    </div>
  );
}

/* ---------------- page ---------------- */
export default function MyVotes() {
  const [votes, setVotes] = useState<MyVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      // ✅ real endpoint from vote.routes.ts
      const response = await api.get("/votes/my-status");
      setVotes(response.data?.data ?? []);
    } catch {
      setError("Unable to load your votes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return votes;
    return votes.filter(
      (v) =>
        (v.electionId?.title ?? "").toLowerCase().includes(q) ||
        v.voteReference.toLowerCase().includes(q),
    );
  }, [votes, query]);

  if (error)
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-danger-50 bg-danger-50 p-8 text-center ring-1 ring-danger-700/10">
        <p role="alert" className="font-sans font-semibold text-danger-700">{error}</p>
        <button onClick={load} className="mt-4 active:scale-95">Try again</button>
      </div>
    );

  if (loading) return <Skeleton />;

  const lastVoted = votes[0]?.submittedAt; // API already sorts newest-first
  const uniqueElections = new Set(votes.map((v) => v.electionId?._id ?? v._id)).size;

  const stats = [
    { label: "Ballots cast", value: votes.length, tone: "brand", icon: <ReceiptIcon className="h-5 w-5" /> },
    { label: "Elections joined", value: uniqueElections, tone: "sky", icon: <LayersIcon className="h-5 w-5" /> },
    { label: "Last voted", value: fmtDate(lastVoted), tone: "violet", icon: <ClockIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-xl sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
          Your ballot history
        </p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">My Votes</h1>
        <p className="mt-3 max-w-xl font-sans text-brand-100/90">
          {votes.length > 0
            ? `You've cast ${votes.length === 1 ? "a ballot" : `${votes.length} ballots`} so far. Keep your reference codes — they prove your vote was counted, without revealing your choices.`
            : "Every ballot you cast will appear here, with a reference code as your proof of voting."}
        </p>
        <div className="mt-6 flex flex-wrap gap-2 font-sans text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
            <ShieldIcon className="h-3.5 w-3.5" /> Anonymous by design
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
            <ClockIcon className="h-3.5 w-3.5" /> Timestamped & verifiable
          </span>
        </div>
      </section>

      {/* Stats */}
      {votes.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} delay={100 + i * 80} />
          ))}
        </section>
      )}

      {/* Search */}
      {votes.length > 3 && (
        <div className="animate-fade-up relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by election name or reference code…"
            className="rounded-xl py-3 pl-11 font-sans"
          />
        </div>
      )}

      {/* Vote list */}
      <section className="space-y-4">
        {votes.length === 0 ? (
          <div className="animate-fade-up rounded-2xl border-2 border-dashed border-brand-200 bg-white/60 p-14 text-center">
            <ReceiptIcon className="mx-auto h-12 w-12 text-brand-300" />
            <h3 className="mt-4 font-bold text-brand-900">No votes yet</h3>
            <p className="mt-1 font-sans text-sm text-ink-500">
              When you participate in an election, your receipt shows up here.
            </p>
            <Link to="/voter/dashboard" className="mt-5 inline-flex items-center gap-1.5">
              Browse active elections <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="animate-fade-up rounded-2xl border-2 border-dashed border-brand-200 bg-white/60 p-10 text-center">
            <p className="font-sans font-semibold text-ink-600">No votes match “{query}”.</p>
            <button type="button" onClick={() => setQuery("")} className="mt-3 !bg-brand-100 !py-2 !text-brand-700">
              Clear search
            </button>
          </div>
        ) : (
          filtered.map((vote, i) => <VoteCard key={vote._id} vote={vote} index={i} />)
        )}
      </section>

      {/* Trust banner */}
      {votes.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-100/70 p-4 font-sans text-sm text-brand-900">
          <ShieldIcon className="h-5 w-5 shrink-0 text-brand-600" />
          Your ballot is encrypted and anonymous — even administrators can't link your identity to your vote. Your reference code only confirms that <em>you voted</em>, never <em>what you chose</em>.
        </div>
      )}
    </div>
  );
}
