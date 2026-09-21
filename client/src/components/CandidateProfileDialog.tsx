// Shared candidate profile dialog.
// Lets a voter read a candidate's complete published profile (photo, party,
// course, year level, candidate statement) from the ballot itself, so every
// candidate is reviewed with the same information before a choice is made.
import { useEffect, useRef } from "react";
import type { SVGProps } from "react";
import { createPortal } from "react-dom";

/* ---------------- types ---------------- */
export interface CandidateProfile {
  _id: string;
  firstName: string;
  lastName: string;
  candidateNumber?: string;
  photoUrl?: string;
  party?: string;
  course?: string;
  yearLevel?: string;
  biography?: string;
}

interface CandidateProfileDialogProps {
  candidate: CandidateProfile;
  positionName?: string;
  electionTitle?: string;
  academicYear?: string;
  selected?: boolean;
  selectionDisabled?: boolean;
  onToggleSelection?: () => void;
  onClose: () => void;
}

/* ---------------- shared helpers ---------------- */
export const candidateAvatarTones = [
  "from-brand-500 to-brand-700",
  "from-sky-500 to-indigo-500",
  "from-violet-500 to-fuchsia-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-600",
  "from-teal-500 to-emerald-600",
];

export const candidateFullName = (candidate: CandidateProfile) =>
  `${candidate.firstName ?? ""} ${candidate.lastName ?? ""}`.trim() || "Unnamed candidate";

export const candidateInitials = (candidate: CandidateProfile) =>
  `${candidate.firstName?.[0] ?? ""}${candidate.lastName?.[0] ?? ""}`.toUpperCase() || "?";

export const candidateMetaLine = (candidate: CandidateProfile) =>
  [candidate.party, candidate.course, candidate.yearLevel ? `Year ${candidate.yearLevel}` : null]
    .filter(Boolean)
    .join(" · ");

export const candidateAvatarTone = (candidate: CandidateProfile) =>
  candidateAvatarTones[(Number(candidate.candidateNumber) || 0) % candidateAvatarTones.length];

/* ---------------- icons ---------------- */
type Icon = SVGProps<SVGSVGElement>;
const ShieldIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const CheckIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);
const XIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
/* ---------------- dialog ---------------- */
export default function CandidateProfileDialog({
  candidate,
  positionName,
  electionTitle,
  academicYear,
  selected = false,
  selectionDisabled = false,
  onToggleSelection,
  onClose,
}: CandidateProfileDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Focus the dialog on open, keep Tab inside it, close on Escape, and stop
  // the ballot behind the dialog from scrolling. This runs once per mount so
  // live page timers re-rendering the ballot never steal focus back.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const name = candidateFullName(candidate);
  const meta = candidateMetaLine(candidate);
  const statement = (candidate.biography ?? "").trim();
  const details = [
    { label: "Position", value: positionName },
    { label: "Candidate number", value: candidate.candidateNumber ? `#${candidate.candidateNumber}` : "" },
    { label: "Party / affiliation", value: candidate.party },
    { label: "Course", value: candidate.course },
    { label: "Year level", value: candidate.yearLevel ? `Year ${candidate.yearLevel}` : "" },
  ].filter((row) => Boolean(row.value));
  const electionNote = electionTitle
    ? `Election: ${electionTitle}${academicYear ? ` · Academic Year ${academicYear}` : ""}.`
    : academicYear
      ? `Academic Year ${academicYear}.`
      : "";

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-[3px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-profile-name"
        className="animate-fade-up relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-brand-200 bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-3xl"
      >
        {/* header */}
        <div className="flex items-start gap-3.5 border-b border-brand-100 bg-brand-50/70 p-5 sm:gap-4 sm:p-6">
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt={name}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-brand-200"
            />
          ) : (
            <span
              className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-linear-to-br font-sans text-lg font-extrabold text-white ${candidateAvatarTone(candidate)}`}
            >
              {candidateInitials(candidate)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-600">
              Candidate profile
            </p>
            <h2 id="candidate-profile-name" className="mt-0.5 truncate text-lg font-extrabold text-brand-900">
              {name}
            </h2>
            {meta && <p className="mt-1 font-sans text-xs text-ink-500">{meta}</p>}
            {positionName && (
              <span className="mt-2 inline-flex items-center rounded-full bg-white px-2.5 py-1 font-sans text-[11px] font-bold text-brand-700 ring-1 ring-brand-500/20">
                Running for {positionName}
              </span>
            )}
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close candidate profile"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-brand-200 bg-white text-ink-500 transition hover:border-brand-400 hover:text-ink-700 active:scale-95"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <h3 className="font-sans text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-600">
            Candidate statement
          </h3>
          {statement ? (
            <p className="mt-2 whitespace-pre-line font-sans text-sm leading-relaxed text-ink-600">{statement}</p>
          ) : (
            <p className="mt-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 p-3 font-sans text-xs leading-relaxed text-ink-500">
              This candidate has not submitted a written statement. Their ballot details are listed below so every
              candidate is presented with the same information.
            </p>
          )}

          {details.length > 0 && (
            <>
              <h3 className="mt-5 font-sans text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-600">
                Ballot details
              </h3>
              <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                {details.map((row) => (
                  <div key={row.label} className="rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2">
                    <dt className="font-sans text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-400">
                      {row.label}
                    </dt>
                    <dd className="mt-0.5 font-sans text-sm font-semibold text-ink-700">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          <p className="mt-5 flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 font-sans text-xs leading-relaxed text-ink-500">
            <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <span>
              Every candidate is published with the same fields by the election committee before voting opens. Reading
              this profile is not recorded with your ballot, so your choice stays anonymous.
              {electionNote ? ` ${electionNote}` : ""}
            </span>
          </p>
        </div>

        {/* actions */}
        <div className="flex flex-col-reverse gap-2 border-t border-brand-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:p-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 font-sans text-sm font-bold text-ink-600 transition hover:border-brand-400 hover:bg-brand-50 active:scale-95"
          >
            Close
          </button>
          {onToggleSelection && (
            <button
              type="button"
              onClick={onToggleSelection}
              disabled={selectionDisabled && !selected}
              className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-4 font-sans text-sm font-bold transition active:scale-95 ${
                selected
                  ? "border-danger-700/25 bg-danger-50 text-danger-700 hover:bg-danger-100"
                  : "border-brand-700 bg-linear-to-r from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/25 hover:brightness-110 disabled:opacity-60"
              }`}
            >
              {selected ? (
                <>
                  <XIcon className="h-4 w-4" /> Remove from my ballot
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" /> Select this candidate
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

