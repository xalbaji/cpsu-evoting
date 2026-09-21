import { useEffect, useMemo, useState } from "react";
import type { SVGProps } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import CandidateProfileDialog, {
  candidateAvatarTone,
  candidateFullName as fullName,
  candidateInitials as initialsOf,
  candidateMetaLine,
} from "../../components/CandidateProfileDialog";
import { api } from "../../lib/api";

/* ---------------- types (matches getBallot) ---------------- */
interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  candidateNumber: string;
  photoUrl?: string;
  party?: string;
  course?: string;
  yearLevel?: string;
  biography?: string;
}

interface Position {
  id: string;
  name: string;
  description?: string;
  votingType: "SINGLE" | "MULTIPLE";
  maxSelections: number;
  candidates: Candidate[];
}

interface ElectionInfo {
  _id: string;
  title: string;
  description?: string;
  academicYear?: string;
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
const CheckIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);
const CalendarIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" />
  </svg>
);
const ShieldIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const ArrowLeftIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 12H5m6 6-6-6 6-6" />
  </svg>
);
const ArrowIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);
const BallotIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="m8.5 11.5 2.5 2.5 4.5-5" />
  </svg>
);
const XIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const InfoIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.6h.01" />
  </svg>
);

/* ---------------- candidate card (full-width row) ---------------- */
function CandidateCard({
  candidate, selected, atMax, multi, onToggle, onViewProfile,
}: {
  candidate: Candidate;
  selected: boolean;
  atMax: boolean;
  multi: boolean;
  onToggle: () => void;
  onViewProfile: () => void;
}) {
  const disabled = atMax && !selected;
  const meta = candidateMetaLine(candidate);
  const statement = (candidate.biography ?? "").trim();

  return (
    <div
      className={`group flex flex-wrap items-center gap-x-2 gap-y-3 rounded-xl border p-3.5 transition-all duration-200 ${
        selected
          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/30"
          : disabled
            ? "border-brand-100 bg-white opacity-60"
            : "border-brand-200 bg-white hover:border-brand-400 hover:shadow-md"
      }`}
    >
      {/* selection target: avatar + identity + indicator */}
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={selected}
        className="flex min-w-0 flex-1 items-center gap-3.5 text-left disabled:cursor-not-allowed"
      >
        {/* avatar */}
        {candidate.photoUrl ? (
          <img
            src={candidate.photoUrl}
            alt={fullName(candidate)}
            className={`h-11 w-11 shrink-0 rounded-full object-cover ${
              selected ? "ring-2 ring-brand-500 ring-offset-2" : "ring-1 ring-brand-200"
            }`}
          />
        ) : (
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-linear-to-br font-sans text-sm font-extrabold text-white ${candidateAvatarTone(candidate)} ${
              selected ? "ring-2 ring-brand-500 ring-offset-2" : ""
            }`}
          >
            {initialsOf(candidate)}
          </span>
        )}

        {/* identity — stretches to fill width and previews the published statement */}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-sans text-sm font-bold text-ink-900">
              {fullName(candidate)}
            </span>
            <span className="shrink-0 rounded bg-brand-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand-700">
              #{candidate.candidateNumber}
            </span>
          </span>
          {meta && <span className="mt-0.5 block truncate font-sans text-xs text-ink-500">{meta}</span>}
          {statement ? (
            <span className="mt-1 line-clamp-2 font-sans text-xs leading-relaxed text-ink-500">
              {statement}
            </span>
          ) : (
            <span className="mt-1 block font-sans text-xs italic text-ink-400">
              No written statement submitted.
            </span>
          )}
        </span>

        {/* selection indicator — circle for SINGLE, square for MULTIPLE */}
        <span
          aria-hidden
          className={`grid h-6 w-6 shrink-0 place-items-center border-2 transition-all duration-200 ${
            multi ? "rounded-md" : "rounded-full"
          } ${
            selected
              ? "scale-100 border-brand-500 bg-brand-500 text-white"
              : "scale-90 border-brand-300 bg-white text-transparent group-hover:border-brand-400"
          }`}
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
      </button>

      {/* full profile trigger — separate button so the two buttons never nest */}
      <button
        type="button"
        onClick={onViewProfile}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 font-sans text-xs font-bold text-brand-700 transition hover:border-brand-400 hover:bg-brand-100 active:scale-95 sm:w-auto"
      >
        <InfoIcon className="h-3.5 w-3.5" />
        View profile
      </button>
    </div>
  );
}

/* ---------------- position section ---------------- */
function PositionSection({
  position, selectedIds, onToggle, onClear, onViewCandidate,
}: {
  position: Position;
  selectedIds: string[];
  onToggle: (candidateId: string) => void;
  onClear: () => void;
  onViewCandidate: (candidate: Candidate) => void;
}) {
  const multi = position.votingType === "MULTIPLE";
  const atMax = multi && selectedIds.length >= position.maxSelections;
  const submittedProfiles = position.candidates.filter(
    (candidate) => (candidate.biography ?? "").trim().length > 0,
  ).length;

  return (
    <section
      id={`section-${position.id}`}
      className="animate-fade-up scroll-mt-36 overflow-hidden rounded-2xl border border-brand-200 bg-white/90 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-brand-50/60 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-brand-900">{position.name}</h2>
          {position.description && (
            <p className="mt-0.5 font-sans text-xs text-ink-500">{position.description}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 font-sans text-xs font-bold text-brand-700 ring-1 ring-brand-500/20">
            {multi ? `Choose up to ${position.maxSelections}` : "Choose 1"}
          </span>
          <span
            className={`rounded-full px-3 py-1 font-sans text-xs font-bold ring-1 ${
              selectedIds.length > 0
                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/25"
                : "bg-slate-100 text-slate-500 ring-slate-500/15"
            }`}
          >
            {selectedIds.length}/{position.maxSelections} selected
          </span>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 font-sans text-xs font-bold text-ink-400 transition hover:text-danger-700"
            >
              <XIcon className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* candidates — single column = full-width rows (height stays compact) */}
      <div className="grid gap-3 p-5 sm:p-6">
        {position.candidates.length === 0 ? (
          <p className="py-4 text-center font-sans text-sm text-ink-500">
            No candidates are running for this position.
          </p>
        ) : (
          position.candidates.map((candidate) => (
            <CandidateCard
              key={candidate._id}
              candidate={candidate}
              multi={multi}
              selected={selectedIds.includes(candidate._id)}
              atMax={atMax}
              onToggle={() => onToggle(candidate._id)}
              onViewProfile={() => onViewCandidate(candidate)}
            />
          ))
        )}
      </div>

      {/* transparency footer — how many candidates published a statement */}
      {position.candidates.length > 0 && (
        <p className="flex items-start gap-2 border-t border-brand-100 bg-brand-50/40 px-5 py-3 font-sans text-xs leading-relaxed text-ink-500 sm:px-6">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
          <span>
            {submittedProfiles === position.candidates.length
              ? `All ${position.candidates.length} candidates submitted a written statement — tap “View profile” to compare them on equal terms.`
              : `${submittedProfiles} of ${position.candidates.length} candidates submitted a written statement. Tap “View profile” to read the same details for every candidate.`}
          </span>
        </p>
      )}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-40 animate-pulse rounded-3xl bg-brand-200/70" />
      <div className="h-20 animate-pulse rounded-2xl bg-brand-200/70" />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-2xl bg-brand-200/70" />
      ))}
    </div>
  );
}

/* ---------------- page ---------------- */
export default function VotingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [election, setElection] = useState<ElectionInfo | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [profileView, setProfileView] = useState<{ candidate: Candidate; position: Position } | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    setAlreadyVoted(false);
    api
      .get(`/elections/${id}/ballot`)
      .then((response) => {
        setElection(response.data.data.election ?? null);
        setPositions(response.data.data.positions ?? []);
      })
      .catch((err: any) => {
        const msg: string = err?.response?.data?.message ?? "Unable to load this ballot.";
        setError(msg);
        if (msg.toLowerCase().includes("already voted")) setAlreadyVoted(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* your toggle logic + one improvement: clicking the same SINGLE
     candidate again deselects (your original couldn't undo a pick) */
  function toggleCandidate(position: Position, candidateId: string) {
    setSelections((current) => {
      const existing = current[position.id] ?? [];

      if (position.votingType === "SINGLE") {
        if (existing.includes(candidateId)) {
          return { ...current, [position.id]: [] };
        }
        return { ...current, [position.id]: [candidateId] };
      }

      if (existing.includes(candidateId)) {
        return {
          ...current,
          [position.id]: existing.filter((x) => x !== candidateId),
        };
      }

      if (existing.length >= position.maxSelections) {
        return current;
      }

      return { ...current, [position.id]: [...existing, candidateId] };
    });
  }

  function clearPosition(positionId: string) {
    setSelections((current) => ({ ...current, [positionId]: [] }));
  }

  function reviewVote() {
    navigate(`/voter/elections/${id}/review`, {
      state: { election, selections, positions },
    });
  }

  const filledCount = useMemo(
    () => positions.filter((p) => (selections[p.id]?.length ?? 0) > 0).length,
    [positions, selections],
  );
  const totalSelections = useMemo(
    () => Object.values(selections).reduce((n, arr) => n + arr.length, 0),
    [selections],
  );
  const progressPct = positions.length > 0 ? (filledCount / positions.length) * 100 : 0;

  const scrollTo = (positionId: string) => {
    document
      .getElementById(`section-${positionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-danger-50 bg-danger-50 p-8 text-center ring-1 ring-danger-700/10">
        <BallotIcon className="mx-auto h-12 w-12 text-danger-700/40" />
        <p role="alert" className="mt-4 font-sans font-semibold text-danger-700">{error}</p>
        {alreadyVoted ? (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="font-sans text-sm text-ink-600">
              One ballot per voter — but you can still view results and your receipt.
            </p>
            <div className="mt-2 flex gap-4">
              <Link to="/voter/my-votes" className="self-center font-sans text-sm font-bold text-brand-600 hover:underline">
                My Votes
              </Link>
              <Link to="/voter/dashboard" className="self-center font-sans text-sm font-bold text-brand-600 hover:underline">
                Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex justify-center gap-4">
            <button onClick={() => window.location.reload()} className="active:scale-95">Try again</button>
            <Link
              to="/voter/dashboard"
              className="inline-flex items-center gap-1.5 self-center font-sans text-sm font-bold text-brand-600 hover:underline"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Dashboard
            </Link>
          </div>
        )}
      </div>
    );
  }

  const votingEnded = Boolean(
    election?.endDate && currentTime >= new Date(election.endDate).getTime(),
  );

  if (votingEnded) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <BallotIcon className="mx-auto h-12 w-12 text-amber-700" />
        <h1 className="mt-4 text-xl font-extrabold text-ink-900">Voting has ended</h1>
        <p className="mt-2 font-sans text-sm text-ink-600">
          The scheduled closing time for this election has passed. No more votes can be submitted.
        </p>
        <Link to="/voter/dashboard" className="mt-5 inline-flex items-center gap-1.5 font-sans text-sm font-bold text-brand-600 hover:underline">
          <ArrowLeftIcon className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="animate-fade-up rounded-2xl border-2 border-dashed border-brand-200 bg-white/60 p-14 text-center">
        <BallotIcon className="mx-auto h-12 w-12 text-brand-300" />
        <h3 className="mt-4 font-bold text-brand-900">No positions are available for this election.</h3>
        <p className="mt-1 font-sans text-sm text-ink-500">
          The ballot may still be being set up. Check back soon.
        </p>
        <Link to="/voter/dashboard" className="mt-5 inline-flex items-center gap-1.5 font-sans text-sm font-bold text-brand-600 hover:underline">
          <ArrowLeftIcon className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  const dates = [fmtDate(election?.startDate), fmtDate(election?.endDate)].filter(Boolean).join(" – ");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
          Official ballot
        </p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">
          {election?.title ?? "Election Ballot"}
        </h1>
        {election?.description && (
          <p className="mt-2 max-w-xl font-sans text-brand-100/90">{election.description}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-2 font-sans text-xs font-medium">
          {dates && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
              <CalendarIcon className="h-3.5 w-3.5" /> {dates}
            </span>
          )}
          {election?.academicYear && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
              AY {election.academicYear}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
            <ShieldIcon className="h-3.5 w-3.5" /> Your choices stay anonymous
          </span>
        </div>
      </section>

      {/* Sticky progress + position nav */}
      <div className="voting-progress-panel rounded-2xl border border-brand-200 bg-white/95 p-4 shadow-sm sm:sticky sm:top-[68px] sm:z-20">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3 font-sans text-xs font-bold">
              <span className="text-brand-900">
                {filledCount} of {positions.length} {positions.length === 1 ? "position" : "positions"} answered
              </span>
              <span className="text-ink-400">{Math.round(progressPct)}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-linear-to-r from-brand-500 to-brand-700 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={reviewVote}
            className="!px-4 !py-2 !text-xs shadow-md shadow-brand-500/30 active:scale-95"
          >
            <span className="inline-flex items-center gap-1.5">
              Review <ArrowIcon className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {positions.map((p, i) => {
            const done = (selections[p.id]?.length ?? 0) > 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => scrollTo(p.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-xs font-bold transition active:scale-95 ${
                  done
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/25 hover:bg-emerald-100"
                    : "bg-brand-50 text-ink-600 ring-1 ring-brand-200 hover:bg-brand-100"
                }`}
              >
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full text-[9px] text-white ${
                    done ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  {done ? <CheckIcon className="h-2.5 w-2.5" /> : i + 1}
                </span>
                <span className="max-w-36 truncate">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fairness note — profiles can be reviewed before choosing */}
      <section className="flex flex-wrap items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 p-4">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <p className="min-w-0 flex-1 font-sans text-xs leading-relaxed text-ink-600">
          <span className="font-bold text-brand-800">Read before you decide.</span> Tap{" "}
          <span className="font-bold">View profile</span> on any candidate to see their full ballot details and written
          statement. Every candidate is published with the same information, and opening a profile is never recorded
          with your ballot.
        </p>
      </section>

      {/* Positions */}
      <div className="space-y-6">
        {positions.map((position) => (
          <PositionSection
            key={position.id}
            position={position}
            selectedIds={selections[position.id] ?? []}
            onToggle={(candidateId) => toggleCandidate(position, candidateId)}
            onClear={() => clearPosition(position.id)}
            onViewCandidate={(candidate) => setProfileView({ candidate, position })}
          />
        ))}
      </div>

      {/* Review summary */}
      <section className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-900">Ready to review?</h2>
            <p className="mt-1 font-sans text-sm text-ink-500">
              {totalSelections === 0
                ? "You haven't selected anyone yet — you can abstain on any or all positions."
                : filledCount < positions.length
                  ? `You've skipped ${positions.length - filledCount} ${positions.length - filledCount === 1 ? "position" : "positions"} — skipped positions count as abstentions.`
                  : "All positions answered. Check your choices one last time before submitting."}
            </p>
          </div>
          <button
            onClick={reviewVote}
            className="w-full shrink-0 bg-linear-to-r from-brand-500 to-brand-700 px-6 py-3 shadow-md shadow-brand-500/30 transition hover:brightness-110 active:scale-95 sm:w-auto"
          >
            <span className="inline-flex items-center justify-center gap-2">
              Review Ballot <ArrowIcon className="h-4 w-4" />
            </span>
          </button>
        </div>
      </section>

      {/* Full candidate profile — opened from any candidate card */}
      {profileView && (
        <CandidateProfileDialog
          candidate={profileView.candidate}
          positionName={profileView.position.name}
          electionTitle={election?.title}
          academicYear={election?.academicYear}
          selected={(selections[profileView.position.id] ?? []).includes(profileView.candidate._id)}
          selectionDisabled={
            profileView.position.votingType === "MULTIPLE" &&
            (selections[profileView.position.id] ?? []).length >= profileView.position.maxSelections
          }
          onToggleSelection={() => toggleCandidate(profileView.position, profileView.candidate._id)}
          onClose={() => setProfileView(null)}
        />
      )}
    </div>
  );
}
