import { useCallback, useEffect, useMemo, useState } from "react";
import type { SVGProps } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import BrandLogo from "../../components/BrandLogo";
import { ThemeSettings } from "../../components/ThemeSettings";
import { CPSU_MAIN_COURSES } from "../../lib/courses";
import { adminRoleLabel, displayAccountName, hasSuperAdminAccess } from "../../lib/access";
/* ---------------- types ---------------- */
interface Election {
  _id: string;
  title: string;
  description?: string;
  course?: string;
  courses?: string[];
  academicYear?: string;
  status: string; // DRAFT | SCHEDULED | ACTIVE | CLOSED | RESULTS_PUBLISHED | CANCELLED
  approvalStatus?: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  startDate?: string;
  endDate?: string;
  resultsPublished?: boolean;
}

interface Position {
  _id: string;
  name: string;
  description?: string;
  order: number;
  votingType: "SINGLE" | "MULTIPLE";
  maxSelections: number;
}

interface Candidate {
  _id: string;
  positionId: string;
  candidateNumber: string;
  firstName: string;
  lastName: string;
  course?: string;
  yearLevel?: string;
  party?: string;
  biography?: string;
  photoUrl?: string;
}

/* ---------------- status helpers ---------------- */
type StatusKey = "draft" | "upcoming" | "active" | "closed" | "published" | "cancelled";

function statusKey(e: Election): StatusKey {
  switch (e.status?.toUpperCase()) {
    case "DRAFT": return "draft";
    case "SCHEDULED": return "upcoming";
    case "ACTIVE": return "active";
    case "RESULTS_PUBLISHED": return "published";
    case "CANCELLED": return "cancelled";
    case "CLOSED":
    default: return "closed";
  }
}

const STATUS_META: Record<StatusKey, { label: string; badge: string }> = {
  draft:     { label: "Draft",             badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/15" },
  upcoming:  { label: "Scheduled",         badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/25" },
  active:    { label: "Active",            badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/25" },
  closed:    { label: "Closed",            badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/25" },
  published: { label: "Closed · Results published", badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-500/40" },
  cancelled: { label: "Cancelled",         badge: "bg-danger-50 text-danger-700 ring-1 ring-danger-700/20" },
};

/* ---------------- date helpers ---------------- */
const fmtDateTimeLocal = (d?: string) => {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const fmtRange = (start?: string, end?: string) => {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  const f = (d?: string) => (d ? new Date(d).toLocaleString("en-US", opts) : null);
  const s = f(start);
  const e = f(end);
  if (!s && !e) return "Dates not set";
  if (s && e) return `${s} – ${e}`;
  return s ?? e ?? "Dates not set";
};

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
const ReceiptIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 3h14v18l-2.33-1.5L14.33 21 12 19.5 9.67 21l-2.34-1.5L5 21V3Z" /><path d="m8.5 11.5 2.5 2.5 4.5-5" />
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
const PlusIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const CalendarIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" />
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
const CheckIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);
const PlayIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
);
const StopIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
);
const MegaphoneIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m3 11 15-6v14L3 13v-2Z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);
const PencilIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
  </svg>
);
const TrashIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" />
  </svg>
);
const ChevronIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/* ---------------- nav (same as AdminDashboard) ---------------- */
const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: GridIcon },
  { path: "/admin/elections", label: "Elections", icon: ShieldIcon },
  { path: "/admin/voters", label: "Voters", icon: UsersIcon },
  { path: "/voter/my-votes", label: "My Votes", icon: ReceiptIcon },
  { path: "/profile", label: "Profile", icon: UsersIcon },
  { path: "/admin/administrators", label: "Administrators", icon: UsersIcon },
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

function StatusBadge({ status }: { status: StatusKey }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs font-bold ${meta.badge}`}>
      {status === "active" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}
      {meta.label}
    </span>
  );
}

function ApprovalBadge({ election }: { election: Election }) {
  if (["ACTIVE", "CLOSED", "RESULTS_PUBLISHED", "CANCELLED"].includes(election.status)) return null;

  const approvalStatus = election.approvalStatus ?? "NOT_SUBMITTED";

  const meta = {
    NOT_SUBMITTED: { label: "Approval needed", className: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/15" },
    PENDING: { label: "Pending approval", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/25" },
    APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/25" },
    REJECTED: { label: "Changes requested", className: "bg-danger-50 text-danger-700 ring-1 ring-danger-700/20" },
  }[approvalStatus];

  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-sans text-xs font-bold ${meta.className}`}>{meta.label}</span>;
}

function MiniStat({ label, value, tone, icon, delay }: {
  label: string; value: number; tone: string; icon: React.ReactNode; delay: number;
}) {
  return (
    <div
      className="animate-fade-up flex items-center gap-4 rounded-2xl border border-brand-200 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-linear-to-br text-white shadow-lg ${toneStyles[tone]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold tabular-nums text-brand-900">{value}</p>
        <p className="font-sans text-sm font-medium text-ink-500">{label}</p>
      </div>
    </div>
  );
}

/* ---------------- create form ---------------- */
const emptyForm = {
  title: "",
  description: "",
  academicYear: String(new Date().getFullYear()),
  startDate: "",
  endDate: "",
};

function electionCourseCodes(election: Pick<Election, "course" | "courses">): string[] {
  const values = election.courses?.length ? election.courses : election.course ? [election.course] : [];
  return Array.from(new Set(values.map((course) => course.trim().toUpperCase()).filter(Boolean)));
}

const COLLEGE_SHORT_NAMES: Record<string, string> = {
  "College of Agriculture and Forestry": "CAF",
  "College of Arts and Sciences": "CAS",
  "College of Information and Computing Studies": "CCS",
  "College of Criminal Justice Education": "CCJE",
  "College of Engineering": "COE",
  "College of Teacher Education": "COTED",
  "College of Business and Hospitality Management": "CHM",
};

function CoursePicker({
  value,
  onChange,
  availableCourses,
}: {
  value: string[];
  onChange: (courses: string[]) => void;
  availableCourses: typeof CPSU_MAIN_COURSES;
}) {
  const availableCodes = availableCourses.map((course) => course.code);
  const allSelected = availableCodes.length > 0 && availableCodes.every((code) => value.includes(code));
  const collegeGroups = useMemo(() => {
    const grouped = new Map<string, typeof availableCourses>();
    availableCourses.forEach((course) => {
      grouped.set(course.college, [...(grouped.get(course.college) ?? []), course]);
    });
    return Array.from(grouped, ([college, courses]) => ({ college, courses }));
  }, [availableCourses]);

  const toggle = (code: string) => {
    onChange(value.includes(code) ? value.filter((selected) => selected !== code) : [...value, code]);
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : availableCodes);
  };

  const toggleCollege = (courses: typeof availableCourses) => {
    const collegeCodes = courses.map((course) => course.code);
    const collegeSelected = collegeCodes.every((code) => value.includes(code));
    onChange(
      collegeSelected
        ? value.filter((code) => !collegeCodes.includes(code))
        : Array.from(new Set([...value, ...collegeCodes])),
    );
  };

  return (
    <div className="course-picker">
      <div className="course-picker-selected" aria-live="polite">
        {allSelected ? (
          <span className="course-picker-all-chip">✓ All {availableCodes.length} programs selected</span>
        ) : value.length > 6 ? (
          <span className="course-picker-all-chip">{value.length} programs selected</span>
        ) : value.length > 0 ? value.map((code) => {
          const option = availableCourses.find((course) => course.code === code);
          return <span key={code} className="course-picker-chip">{option?.code ?? code}</span>;
        }) : <span className="course-picker-placeholder">No course selected yet</span>}
      </div>
      <details className="course-picker-details">
        <summary>
          <span>{value.length ? `${value.length} course${value.length === 1 ? "" : "s"} selected` : "Choose courses / programs"}</span>
          <ChevronIcon className="h-4 w-4" />
        </summary>
        <div className="course-picker-options">
          <div className={`course-picker-bulk-actions ${allSelected ? "selected" : ""}`}>
            <label className="course-picker-select-all">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              <span>
                <strong>Select all programs</strong>
                <small>{availableCodes.length} available</small>
              </span>
            </label>
            {value.length > 0 && <button type="button" className="course-picker-clear" onClick={() => onChange([])}>Clear</button>}
          </div>
          {collegeGroups.map((group) => {
            const groupCodes = group.courses.map((course) => course.code);
            const selectedCount = groupCodes.filter((code) => value.includes(code)).length;
            const groupSelected = selectedCount === groupCodes.length;
            return (
              <section key={group.college} className="course-picker-college-group">
                <div className={`course-picker-college-header ${groupSelected ? "selected" : ""}`}>
                  <label className="course-picker-college-select">
                    <input type="checkbox" checked={groupSelected} onChange={() => toggleCollege(group.courses)} />
                    <span>
                      <strong>{COLLEGE_SHORT_NAMES[group.college] ?? group.college}</strong>
                      <small>{group.college}</small>
                    </span>
                  </label>
                  <span className="course-picker-college-count">{selectedCount}/{group.courses.length}</span>
                </div>
                <div className="course-picker-college-programs">
                  {group.courses.map((course) => (
                    <label key={course.code} className={`course-picker-option ${value.includes(course.code) ? "selected" : ""}`}>
                      <input type="checkbox" checked={value.includes(course.code)} onChange={() => toggle(course.code)} />
                      <span>
                        <strong>{course.code}</strong>
                        <small>{course.name}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function CreateElectionForm({ onCreated, availableCourses, isSuperAdmin }: { onCreated: () => void; availableCourses: typeof CPSU_MAIN_COURSES; isSuperAdmin: boolean }) {
  const [form, setForm] = useState({ ...emptyForm, courses: availableCourses[0]?.code ? [availableCourses[0].code] : [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const invalidRange =
    !!form.startDate && !!form.endDate &&
    new Date(form.endDate).getTime() <= new Date(form.startDate).getTime();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) return setError("Please give the election a title.");
    if (!form.courses.length) return setError("Select at least one course or program.");
    if (!form.startDate || !form.endDate) return setError("Start and end dates are both required.");
    if (invalidRange) return setError("End date must be after the start date.");

    setSaving(true);
    try {
      // ✅ POST /elections — matches createElection exactly
      const response = await api.post("/elections", {
        title: form.title.trim(),
        description: form.description.trim(),
        course: form.courses[0],
        courses: form.courses,
        academicYear: form.academicYear.trim(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      const created = response.data?.data;
      setForm({ ...emptyForm, courses: availableCourses[0]?.code ? [availableCourses[0].code] : [] });
      setSuccess(`“${created?.title ?? "Election"}” was created as a draft — add positions and candidates, then ${isSuperAdmin ? "open voting when ready" : "submit it for Super Admin approval before opening voting"}.`);
      window.setTimeout(() => setSuccess(""), 5000);
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to create the election.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-lg font-bold text-brand-900">
        <PlusIcon className="h-5 w-5 text-brand-600" /> Create Election
      </h2>
      <p className="mt-1 font-sans text-sm text-ink-500">
         Select one or more programs. Verified students from any selected program can see and vote in this election.
      </p>

      {success && (
        <p role="status" className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-sans text-sm font-semibold text-emerald-800">
          <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
          {success}
        </p>
      )}
      {error && <p role="alert" className="mt-5">{error}</p>}

      <form onSubmit={submit} className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          Title
          <input
            value={form.title}
            onChange={(e) => set("title")(e.target.value)}
            placeholder="CPSU Student Council Election 2026"
            className="mt-1"
          />
        </label>
        <label className="sm:col-span-2">
          Description
          <textarea
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            placeholder="What are students voting on? Who is eligible?"
            rows={3}
            className="mt-1 resize-y"
          />
        </label>
        <label className="course-picker-field">
          Course / program
          <CoursePicker value={form.courses} onChange={(courses) => setForm((current) => ({ ...current, courses }))} availableCourses={availableCourses} />
        </label>
        <label>
          Academic year
          <input
            value={form.academicYear}
            onChange={(e) => set("academicYear")(e.target.value)}
            placeholder="2026"
            className="mt-1"
          />
        </label>
        <div />

        <label>
          Start date
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => set("startDate")(e.target.value)}
            className="mt-1"
          />
        </label>
        <label>
          End date
          <input
            type="datetime-local"
            value={form.endDate}
            min={form.startDate || undefined}
            onChange={(e) => set("endDate")(e.target.value)}
            className="mt-1"
          />
        </label>

        {invalidRange && (
          <p className="font-sans text-xs font-semibold text-danger-700 sm:col-span-2">
            ⚠ End date must be after the start date.
          </p>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving || !!invalidRange}
            className="min-w-40 bg-linear-to-r from-brand-500 to-brand-700 shadow-md shadow-brand-500/30 transition hover:brightness-110 active:scale-95"
          >
            {saving ? "Creating…" : "Create election"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ---------------- inline edit form (PATCH /elections/:id — drafts & scheduled only) ---------------- */
function EditElectionForm({
  election, onSaved, onCancel, availableCourses,
}: {
  election: Election;
  onSaved: () => void;
  onCancel: () => void;
  availableCourses: typeof CPSU_MAIN_COURSES;
}) {
  const [form, setForm] = useState({
    title: election.title,
    description: election.description ?? "",
    courses: electionCourseCodes(election),
    academicYear: election.academicYear ?? "",
    startDate: fmtDateTimeLocal(election.startDate),
    endDate: fmtDateTimeLocal(election.endDate),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: Exclude<keyof typeof form, "courses">) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const invalidRange =
    !!form.startDate && !!form.endDate &&
    new Date(form.endDate).getTime() <= new Date(form.startDate).getTime();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.courses.length) return setError("Select at least one course or program.");
    if (!form.startDate || !form.endDate) return setError("Start and end dates are both required.");
    if (invalidRange) return setError("End date must be after the start date.");

    setSaving(true);
    try {
      // ✅ PATCH /elections/:id — updateElection replaces all 5 fields
      await api.patch(`/elections/${election._id}`, {
         title: form.title.trim(),
         description: form.description.trim(),
         course: form.courses[0],
         courses: form.courses,
         academicYear: form.academicYear.trim(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="border-t border-brand-100 bg-brand-50/50 p-5">
      <p className="mb-4 font-sans text-xs font-bold uppercase tracking-wide text-ink-400">
        Editing — only drafts and scheduled elections can be modified
      </p>
      {error && <p role="alert" className="mb-4">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          Title
          <input value={form.title} onChange={(e) => set("title")(e.target.value)} className="mt-1" />
        </label>
        <label className="sm:col-span-2">
          Description
          <textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={2} className="mt-1 resize-y" />
        </label>
        <label className="course-picker-field">
          Course / program
          <CoursePicker value={form.courses} onChange={(courses) => setForm((current) => ({ ...current, courses }))} availableCourses={availableCourses} />
        </label>
        <label>
          Academic year
          <input value={form.academicYear} onChange={(e) => set("academicYear")(e.target.value)} className="mt-1" />
        </label>
        <div />
        <label>
          Start date
          <input type="datetime-local" value={form.startDate} onChange={(e) => set("startDate")(e.target.value)} className="mt-1" />
        </label>
        <label>
          End date
          <input type="datetime-local" value={form.endDate} min={form.startDate || undefined} onChange={(e) => set("endDate")(e.target.value)} className="mt-1" />
        </label>
      </div>

      {invalidRange && (
        <p className="mt-3 font-sans text-xs font-semibold text-danger-700">
          ⚠ End date must be after the start date.
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <button type="submit" disabled={saving || !!invalidRange} className="!py-2 !text-xs active:scale-95">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="!bg-white !py-2 !text-xs !text-ink-700 ring-1 ring-brand-300 hover:!bg-brand-50 active:scale-95"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function BallotEditor({ election, onChanged }: { election: Election; onChanged: () => void }) {
  const courseCodes = useMemo(() => electionCourseCodes(election), [election.course, election.courses]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positionForm, setPositionForm] = useState({ name: "", description: "", votingType: "SINGLE" as Position["votingType"], maxSelections: "1" });
  const [candidateForm, setCandidateForm] = useState({ positionId: "", candidateNumber: "", firstName: "", lastName: "", course: courseCodes[0] ?? "", yearLevel: "", party: "", biography: "", photoUrl: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadBallot = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [positionResponse, candidateResponse] = await Promise.all([
        api.get(`/elections/${election._id}/positions`),
        api.get(`/elections/${election._id}/candidates`),
      ]);
      const nextPositions = positionResponse.data?.data ?? [];
      setPositions(nextPositions);
      setCandidates(candidateResponse.data?.data ?? []);
      setCandidateForm((current) => ({
        ...current,
        positionId: current.positionId || nextPositions[0]?._id || "",
        course: courseCodes.includes(current.course) ? current.course : courseCodes[0] ?? "",
      }));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Unable to load the ballot editor.");
    } finally {
      setLoading(false);
    }
  }, [courseCodes, election._id]);

  useEffect(() => {
    loadBallot();
  }, [loadBallot]);

  const submitPosition = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!positionForm.name.trim()) return setError("Position name is required.");
    const maxSelections = positionForm.votingType === "SINGLE" ? 1 : Math.max(Number(positionForm.maxSelections) || 1, 1);
    setBusy(true);
    setError("");
    try {
      await api.post(`/elections/${election._id}/positions`, {
        name: positionForm.name.trim(),
        description: positionForm.description.trim(),
        order: positions.length + 1,
        votingType: positionForm.votingType,
        maxSelections,
      });
      setPositionForm({ name: "", description: "", votingType: "SINGLE", maxSelections: "1" });
      await loadBallot();
      onChanged();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Unable to add the position.");
    } finally {
      setBusy(false);
    }
  };

  const submitCandidate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const positionId = String(formData.get("positionId") ?? candidateForm.positionId).trim();
    const candidateNumber = String(formData.get("candidateNumber") ?? candidateForm.candidateNumber).trim();
    const firstName = String(formData.get("firstName") ?? candidateForm.firstName).trim();
    const lastName = String(formData.get("lastName") ?? candidateForm.lastName).trim();
    const yearLevel = String(formData.get("yearLevel") ?? candidateForm.yearLevel).trim();
    const party = String(formData.get("party") ?? candidateForm.party).trim();
    const biography = String(formData.get("biography") ?? candidateForm.biography).trim();
    const typedPhotoUrl = String(formData.get("photoUrl") ?? "").trim();
    const photoUrl = candidateForm.photoUrl.startsWith("data:") ? candidateForm.photoUrl : typedPhotoUrl;

    setCandidateForm((current) => ({
      ...current,
      positionId,
      candidateNumber,
      firstName,
      lastName,
      yearLevel,
      party,
      biography,
      photoUrl,
    }));

    if (!positionId) return setError("Select a position for the candidate.");
    if (!candidateNumber || !firstName || !lastName) {
      return setError("Candidate number, first name, and last name are required.");
    }
    setBusy(true);
    setError("");
    try {
      await api.post("/candidates", {
        electionId: election._id,
        positionId,
        candidateNumber,
        firstName,
        lastName,
        course: candidateForm.course,
        yearLevel,
        party,
        biography,
        photoUrl,
      });
      setCandidateForm((current) => ({
        ...current,
        candidateNumber: "",
        firstName: "",
        lastName: "",
        yearLevel: "",
        party: "",
        biography: "",
        photoUrl: "",
      }));
      await loadBallot();
      onChanged();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Unable to add the candidate.");
    } finally {
      setBusy(false);
    }
  };

  const handleCandidatePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for the candidate photo.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Please choose a candidate photo smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCandidateForm((current) => ({ ...current, photoUrl: String(reader.result ?? "") }));
    };
    reader.readAsDataURL(file);
  };

  const removePosition = async (position: Position) => {
    if (!window.confirm(`Delete the ${position.name} position? Candidates assigned to it will also be removed.`)) return;
    setBusy(true);
    setError("");
    try {
      await api.delete(`/positions/${position._id}`);
      await loadBallot();
      onChanged();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Unable to delete the position.");
    } finally {
      setBusy(false);
    }
  };

  const removeCandidate = async (candidate: Candidate) => {
    if (!window.confirm(`Remove ${candidate.firstName} ${candidate.lastName} from this election?`)) return;
    setBusy(true);
    setError("");
    try {
      await api.delete(`/candidates/${candidate._id}`);
      await loadBallot();
      onChanged();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Unable to remove the candidate.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t border-brand-100 bg-brand-50/50 px-5 py-5 font-sans">
      <div className="ballot-builder-heading flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ballot-builder-eyebrow">Election setup</p>
          <h4 className="text-base font-bold text-brand-900">Build the ballot</h4>
          <p className="mt-1 text-xs text-ink-500">Shape each office and preview how candidates will appear to voters.</p>
        </div>
        <div className="ballot-builder-counts" aria-label="Ballot totals">
          <span><strong>{positions.length}</strong> position{positions.length === 1 ? "" : "s"}</span>
          <span><strong>{candidates.length}</strong> candidate{candidates.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-700">{error}</p>}
      {loading ? (
        <p className="mt-4 text-xs text-ink-500">Loading positions and candidates…</p>
      ) : (
        <>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <form onSubmit={submitPosition} className="rounded-xl border border-brand-200 bg-white p-4 shadow-sm">
              <h5 className="font-bold text-brand-900">Add position</h5>
              <div className="mt-3 grid gap-3">
                <label className="text-xs font-bold text-ink-700">Position name
                  <input value={positionForm.name} onChange={(event) => setPositionForm((current) => ({ ...current, name: event.target.value }))} placeholder="President" className="mt-1" />
                </label>
                <label className="text-xs font-bold text-ink-700">Instructions / description
                  <input value={positionForm.description} onChange={(event) => setPositionForm((current) => ({ ...current, description: event.target.value }))} placeholder="Choose one candidate" className="mt-1" />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold text-ink-700">Voting type
                    <select value={positionForm.votingType} onChange={(event) => setPositionForm((current) => ({ ...current, votingType: event.target.value as Position["votingType"] }))} className="mt-1">
                      <option value="SINGLE">Single choice</option>
                      <option value="MULTIPLE">Multiple choice</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-ink-700">Maximum selections
                    <input type="number" min={1} disabled={positionForm.votingType === "SINGLE"} value={positionForm.votingType === "SINGLE" ? "1" : positionForm.maxSelections} onChange={(event) => setPositionForm((current) => ({ ...current, maxSelections: event.target.value }))} className="mt-1" />
                  </label>
                </div>
                <button type="submit" disabled={busy} className="w-fit !px-3.5 !py-2 !text-xs active:scale-95"><PlusIcon className="mr-1.5 inline h-3.5 w-3.5" /> Add position</button>
              </div>
            </form>

            <form onSubmit={submitCandidate} className="rounded-xl border border-brand-200 bg-white p-4 shadow-sm">
              <h5 className="font-bold text-brand-900">Add candidate</h5>
              <div className="mt-3 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold text-ink-700">Position
                    <select name="positionId" value={candidateForm.positionId} onChange={(event) => setCandidateForm((current) => ({ ...current, positionId: event.target.value }))} className="mt-1" disabled={positions.length === 0}>
                      {positions.length === 0 ? <option value="">Add a position first</option> : positions.map((position) => <option key={position._id} value={position._id}>{position.name}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-ink-700">Candidate number
                    <input name="candidateNumber" autoComplete="off" value={candidateForm.candidateNumber} onChange={(event) => setCandidateForm((current) => ({ ...current, candidateNumber: event.target.value }))} placeholder="01" className="mt-1" />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold text-ink-700">First name
                    <input name="firstName" autoComplete="given-name" value={candidateForm.firstName} onChange={(event) => setCandidateForm((current) => ({ ...current, firstName: event.target.value }))} className="mt-1" />
                  </label>
                  <label className="text-xs font-bold text-ink-700">Last name
                    <input name="lastName" autoComplete="family-name" value={candidateForm.lastName} onChange={(event) => setCandidateForm((current) => ({ ...current, lastName: event.target.value }))} className="mt-1" />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-xs font-bold text-ink-700">Course
                    <select value={candidateForm.course} onChange={(event) => setCandidateForm((current) => ({ ...current, course: event.target.value }))} className="mt-1">
                      {courseCodes.map((course) => <option key={course} value={course}>{course}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-ink-700">Year level
                    <input name="yearLevel" value={candidateForm.yearLevel} onChange={(event) => setCandidateForm((current) => ({ ...current, yearLevel: event.target.value }))} placeholder="4" className="mt-1" />
                  </label>
                  <label className="text-xs font-bold text-ink-700">Party / slate
                    <input name="party" value={candidateForm.party} onChange={(event) => setCandidateForm((current) => ({ ...current, party: event.target.value }))} placeholder="Independent" className="mt-1" />
                  </label>
                </div>
                <div className="candidate-photo-fields">
                  <label className="text-xs font-bold text-ink-700">Photo URL (optional)
                    <input name="photoUrl" value={candidateForm.photoUrl.startsWith("data:") ? "" : candidateForm.photoUrl} onChange={(event) => setCandidateForm((current) => ({ ...current, photoUrl: event.target.value }))} placeholder="https://…" className="mt-1" />
                  </label>
                  <div className="candidate-photo-upload-wrap">
                    <span>Or upload from device</span>
                    <label className="candidate-photo-upload">
                      Choose image
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCandidatePhotoChange} className="sr-only" />
                    </label>
                  </div>
                </div>
                {candidateForm.photoUrl && (
                  <div className="candidate-photo-preview">
                    <img src={candidateForm.photoUrl} alt="Candidate photo preview" />
                    <div>
                      <strong>Photo ready</strong>
                      <span>It will be saved with this candidate.</span>
                    </div>
                    <button type="button" onClick={() => setCandidateForm((current) => ({ ...current, photoUrl: "" }))}>Remove</button>
                  </div>
                )}
                <label className="text-xs font-bold text-ink-700">Biography (optional)
                  <textarea name="biography" value={candidateForm.biography} onChange={(event) => setCandidateForm((current) => ({ ...current, biography: event.target.value }))} rows={2} className="mt-1 resize-y" />
                </label>
                <button type="submit" disabled={busy || positions.length === 0} className="w-fit !px-3.5 !py-2 !text-xs active:scale-95"><PlusIcon className="mr-1.5 inline h-3.5 w-3.5" /> Add candidate</button>
              </div>
            </form>
          </div>

          <div className="ballot-preview-heading">
            <div>
              <p className="ballot-builder-eyebrow">Live ballot preview</p>
              <h5>Inserted candidates</h5>
            </div>
            <span>{candidates.length ? "Ready to review" : "Waiting for candidates"}</span>
          </div>

          <div className="ballot-preview-grid">
            {positions.length === 0 ? (
              <div className="ballot-empty-state">
                <span className="ballot-empty-icon">＋</span>
                <strong>No positions yet</strong>
                <p>Add the offices students will vote for, then candidates can be placed under each one.</p>
              </div>
            ) : positions.map((position) => (
              <article key={position._id} className="ballot-position-card">
                <div className="ballot-position-header">
                  <div className="ballot-position-number">{String(position.order).padStart(2, "0")}</div>
                  <div className="min-w-0">
                    <p className="ballot-position-label">Position {position.order}</p>
                    <h5>{position.name}</h5>
                    <p className="ballot-position-description">{position.votingType === "MULTIPLE" ? `Choose up to ${position.maxSelections}` : "Choose one candidate"}{position.description ? ` · ${position.description}` : ""}</p>
                  </div>
                  <button type="button" onClick={() => removePosition(position)} disabled={busy} className="ballot-delete-button !bg-transparent" aria-label={`Delete ${position.name}`} title="Delete position"><TrashIcon className="h-4 w-4" /></button>
                </div>
                <div className="ballot-candidate-list">
                  {candidates.filter((candidate) => candidate.positionId === position._id).map((candidate) => (
                    <div key={candidate._id} className="ballot-candidate-card">
                      {candidate.photoUrl ? <img className="ballot-candidate-avatar" src={candidate.photoUrl} alt={`${candidate.firstName} ${candidate.lastName}`} /> : <div className="ballot-candidate-avatar ballot-candidate-initials" aria-hidden="true">{`${candidate.firstName?.[0] ?? ""}${candidate.lastName?.[0] ?? ""}`.toUpperCase()}</div>}
                      <div className="ballot-candidate-details">
                        <div className="ballot-candidate-name-row">
                          <span className="ballot-candidate-number">#{candidate.candidateNumber}</span>
                          <strong>{candidate.firstName} {candidate.lastName}</strong>
                        </div>
                        <div className="ballot-candidate-tags">
                          {candidate.course && <span>{candidate.course}</span>}
                          {candidate.yearLevel && <span>Year {candidate.yearLevel}</span>}
                          {candidate.party && <span>{candidate.party}</span>}
                        </div>
                        {candidate.biography && <p>{candidate.biography}</p>}
                      </div>
                      <button type="button" onClick={() => removeCandidate(candidate)} disabled={busy} className="ballot-delete-button candidate-delete-button !bg-transparent" aria-label={`Remove ${candidate.firstName} ${candidate.lastName}`} title="Remove candidate"><TrashIcon className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {candidates.filter((candidate) => candidate.positionId === position._id).length === 0 && <div className="ballot-position-empty"><span>＋</span><p>No candidates added yet</p><small>Add a candidate using the form above.</small></div>}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------- election row ---------------- */
function ElectionRow({
  election, onAction, onEdited, busy, availableCourses, isSuperAdmin,
}: {
  election: Election;
  onAction: (election: Election, action: "open" | "close" | "publish" | "schedule" | "delete" | "request-approval" | "approve" | "reject") => void;
  onEdited: () => void;
  busy: boolean;
  availableCourses: typeof CPSU_MAIN_COURSES;
  isSuperAdmin: boolean;
}) {
  const status = statusKey(election);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const canEdit = status === "draft" || status === "upcoming";
  const approvalStatus = election.approvalStatus ?? "NOT_SUBMITTED";
  const approvalReady = approvalStatus === "APPROVED" || (isSuperAdmin && approvalStatus !== "PENDING");
  const canRequestApproval = !isSuperAdmin && status === "draft" && approvalStatus !== "PENDING" && approvalStatus !== "APPROVED";

  return (
    <article className="election-row animate-fade-up overflow-hidden rounded-2xl border border-brand-200 bg-white/90 shadow-sm transition-all duration-300 hover:border-brand-500/40 hover:shadow-md">
      <div className="election-row-main flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="election-row-copy min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="min-w-0 break-words font-bold leading-tight text-brand-900">{election.title}</h3>
            <StatusBadge status={status} />
            <ApprovalBadge election={election} />
          </div>
          {election.description && (
            <p className="mt-0.5 line-clamp-1 font-sans text-sm text-ink-500">{election.description}</p>
          )}
           <p className="election-meta mt-1.5 inline-flex items-center gap-1.5 font-sans text-xs text-ink-500">
            <CalendarIcon className="h-3.5 w-3.5" />
            {fmtRange(election.startDate, election.endDate)}
            {election.academicYear && <span className="text-ink-400">· AY {election.academicYear}</span>}
           </p>
           <div className="election-course-list mt-2">
             {electionCourseCodes(election).length > 0 ? electionCourseCodes(election).map((course) => (
               <span key={course} className="election-course-chip">{course}</span>
             )) : <span className="election-missing-course">Course not assigned</span>}
           </div>
         </div>

         <div className="election-actions flex shrink-0 flex-wrap items-center gap-2">
          {status === "draft" && (
            <>
              {approvalReady ? (
                <>
                  <button onClick={() => onAction(election, "schedule")} disabled={busy}
                    className="!bg-white !px-3.5 !py-2 !text-xs !text-ink-700 ring-1 ring-brand-300 hover:!bg-brand-50 active:scale-95">
                    <span className="inline-flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> Schedule</span>
                  </button>
                  <button onClick={() => onAction(election, "open")} disabled={busy} className="!px-3.5 !py-2 !text-xs active:scale-95">
                    <span className="inline-flex items-center gap-1.5"><PlayIcon className="h-3 w-3" /> Open voting</span>
                  </button>
                </>
              ) : canRequestApproval ? (
                <button onClick={() => onAction(election, "request-approval")} disabled={busy} className="!px-3.5 !py-2 !text-xs active:scale-95">
                  <span className="inline-flex items-center gap-1.5"><MegaphoneIcon className="h-3.5 w-3.5" /> Submit for approval</span>
                </button>
              ) : isSuperAdmin && approvalStatus === "PENDING" ? (
                <>
                  <button onClick={() => onAction(election, "approve")} disabled={busy} className="!bg-linear-to-r !from-emerald-500 !to-teal-600 !px-3.5 !py-2 !text-xs shadow-md shadow-emerald-500/20 active:scale-95">
                    <span className="inline-flex items-center gap-1.5"><CheckIcon className="h-3.5 w-3.5" /> Approve</span>
                  </button>
                  <button onClick={() => onAction(election, "reject")} disabled={busy}
                    className="!bg-white !px-3.5 !py-2 !text-xs !text-danger-700 ring-1 ring-danger-700/30 hover:!bg-danger-50 active:scale-95">
                    Request changes
                  </button>
                </>
              ) : (
                <span className="font-sans text-xs font-semibold text-ink-400">Waiting for Super Admin approval</span>
              )}
            </>
          )}
          {status === "upcoming" && (
            <>
              <button onClick={() => onAction(election, "open")} disabled={busy || !approvalReady} className="!px-3.5 !py-2 !text-xs active:scale-95">
                <span className="inline-flex items-center gap-1.5"><PlayIcon className="h-3 w-3" /> Open voting</span>
              </button>
              <button onClick={() => onAction(election, "delete")} disabled={busy}
                className="!bg-white !px-2.5 !py-2 !text-danger-700 ring-1 ring-danger-700/30 hover:!bg-danger-50 active:scale-95"
                aria-label="Delete election" title="Delete unpublished election">
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {status === "active" && (
            <button onClick={() => onAction(election, "close")} disabled={busy}
              className="!bg-white !px-3.5 !py-2 !text-xs !text-ink-700 ring-1 ring-brand-300 hover:!bg-brand-50 active:scale-95">
              <span className="inline-flex items-center gap-1.5"><StopIcon className="h-3 w-3" /> Close voting</span>
            </button>
          )}
          {status === "closed" && (
            <>
              <button onClick={() => onAction(election, "publish")} disabled={busy}
                className="!bg-linear-to-r !from-amber-500 !to-orange-500 !px-3.5 !py-2 !text-xs shadow-md shadow-amber-500/30 active:scale-95">
                <span className="inline-flex items-center gap-1.5"><MegaphoneIcon className="h-3.5 w-3.5" /> Publish results</span>
              </button>
              <button onClick={() => onAction(election, "delete")} disabled={busy}
                className="!bg-white !px-2.5 !py-2 !text-danger-700 ring-1 ring-danger-700/30 hover:!bg-danger-50 active:scale-95"
                aria-label="Delete election" title="Delete unpublished election">
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {status === "draft" && (
            <button onClick={() => onAction(election, "delete")} disabled={busy}
              className="!bg-white !px-2.5 !py-2 !text-danger-700 ring-1 ring-danger-700/30 hover:!bg-danger-50 active:scale-95"
              aria-label="Delete election" title="Delete unpublished election">
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
          {status === "cancelled" && (
            <button onClick={() => onAction(election, "delete")} disabled={busy}
              className="!bg-white !px-2.5 !py-2 !text-danger-700 ring-1 ring-danger-700/30 hover:!bg-danger-50 active:scale-95"
              aria-label="Delete election" title="Delete unpublished election">
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
          {status === "published" && (
            <Link to={`/voter/elections/${election._id}/results`} className="font-sans text-sm font-bold text-brand-600 hover:underline">
              View results →
            </Link>
          )}

          {canEdit && (
            <button
              onClick={() => { setEditing(!editing); setExpanded(false); }}
              disabled={busy}
              className="!bg-transparent !px-2 !py-2 !text-ink-400 hover:!text-brand-600"
              aria-label="Edit election" title="Edit"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => { setExpanded(!expanded); setEditing(false); }}
            className="!bg-transparent !px-2 !py-2 !text-ink-400 hover:!text-brand-600"
            aria-label="Toggle details"
          >
            <ChevronIcon className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {editing && (
        <EditElectionForm election={election} availableCourses={availableCourses} onSaved={() => { setEditing(false); onEdited(); }} onCancel={() => setEditing(false)} />
      )}

      {expanded && !editing && (
        <div>
          {canEdit && <BallotEditor election={election} onChanged={onEdited} />}
          <div className="border-t border-brand-100 bg-brand-50/50 px-5 py-4 font-sans text-xs text-ink-600">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="font-bold uppercase tracking-wide text-ink-400">Starts</p>
                <p>{election.startDate ? new Date(election.startDate).toLocaleString() : "Not set"}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wide text-ink-400">Ends</p>
                <p>{election.endDate ? new Date(election.endDate).toLocaleString() : "Not set"}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wide text-ink-400">Raw status</p>
                <p className="font-mono">{election.status}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wide text-ink-400">Approval</p>
                <p className="font-mono">{approvalStatus}</p>
                {election.rejectionReason && <p className="mt-1 text-danger-700">{election.rejectionReason}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-40 animate-pulse rounded-3xl bg-brand-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-brand-200/70" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-brand-200/70" />
      ))}
    </div>
  );
}

/* ---------------- page ---------------- */
export default function Elections() {
  const { logout, refreshUser, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [elections, setElections] = useState<Election[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isSuperAdmin = hasSuperAdminAccess(user);
  const availableCourses = isSuperAdmin
    ? CPSU_MAIN_COURSES
    : CPSU_MAIN_COURSES.filter((course) =>
        (user?.managedCourses ?? [])
          .map((value) => value.toUpperCase())
          .includes(course.code),
      );

  const load = useCallback(async () => {
    setError("");
    try {
      // ✅ GET /elections — getElections, sorted by startDate desc
      const response = await api.get("/elections");
      setElections(response.data?.data ?? []);
    } catch {
      setError("Unable to load elections.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* Lifecycle actions. Unpublished elections use DELETE instead of cancel. */
  const ENDPOINTS = {
    open: "open",
    close: "close",
    publish: "publish-results",
    schedule: "schedule",
    "request-approval": "request-approval",
    approve: "approve",
    reject: "reject",
  } as const;

  type Action = keyof typeof ENDPOINTS | "delete";

  const onAction = async (election: Election, action: Action) => {
    const confirmMsg: Record<Action, string | null> = {
      open: `Open voting for “${election.title}”? Voters will be able to cast ballots immediately.`,
      close: `Close voting for “${election.title}”? Voters will no longer be able to vote.`,
      publish: `Publish the results of “${election.title}”? They become visible to all students and are final.`,
      schedule: `Schedule “${election.title}”? You can still open it manually later.`,
      delete: `Permanently delete the unpublished election “${election.title}”? This cannot be undone.`,
      "request-approval": `Submit “${election.title}” for Super Admin approval? Voting will stay closed until it is approved.`,
      approve: `Approve “${election.title}” for voting? The ${electionCourseCodes(election).join(", ") || "assigned course"} moderator will then be able to schedule or open it.`,
      reject: `Return “${election.title}” to the course moderator for changes?`,
    };
    const msg = confirmMsg[action];
    if (msg && !window.confirm(msg)) return;

    setBusy(true);
    try {
      let message = "";
      if (action === "delete") {
        const res = await api.delete(`/elections/${election._id}`);
        message = res.data?.message ?? "Election deleted";
      } else {
        const res = await api.post(`/elections/${election._id}/${ENDPOINTS[action]}`, action === "reject"
          ? { reason: "Please review and update the election details before resubmitting." }
          : undefined);
        message = res.data?.message ?? "Done";
      }
      await load();
      setNotice(message);
      window.setTimeout(() => setNotice(""), 4000);
    } catch (err: any) {
      window.alert(err?.response?.data?.message ?? "Unable to update the election.");
    } finally {
      setBusy(false);
    }
  };

  // called by the edit form after a successful PATCH
  const onEdited = useCallback(async () => {
    await load();
    setNotice("Election updated");
    window.setTimeout(() => setNotice(""), 4000);
  }, [load]);

  const counts = (elections ?? []).reduce(
    (acc, e) => {
      acc[statusKey(e)] += 1;
      return acc;
    },
    { draft: 0, upcoming: 0, active: 0, closed: 0, published: 0, cancelled: 0 } as Record<StatusKey, number>,
  );
  const total = elections?.length ?? 0;

  const sorted = [...(elections ?? [])].sort((a, b) => {
    const order: Record<StatusKey, number> = {
      active: 0, upcoming: 1, draft: 2, closed: 3, published: 4, cancelled: 5,
    };
    const d = order[statusKey(a)] - order[statusKey(b)];
    if (d !== 0) return d;
    return (b.startDate ?? "").localeCompare(a.startDate ?? "");
  });

  return (
    <div className="admin-page min-h-screen bg-brand-50 pt-16 font-serif text-ink-900">
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
          <span className="hidden text-[1.05rem] font-semibold tracking-wide sm:block">CPSU E-Voting</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-brand-300">{displayAccountName(user, "Course Moderator")}</span>
          <span className="header-role-badge">{adminRoleLabel(user)}</span>
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
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Administration</p>
          <div className="sidebar-context">
            <span className="sidebar-context-dot" />
            <div>
              <strong>{adminRoleLabel(user)} workspace</strong>
              <span>{hasSuperAdminAccess(user) ? "Manage every course" : "Managing assigned course elections"}</span>
            </div>
          </div>
          {NAV_ITEMS.map((item) => {
            if (item.path === "/admin/administrators" && !hasSuperAdminAccess(user)) return null;
            if (["/profile", "/voter/my-votes"].includes(item.path) && hasSuperAdminAccess(user)) return null;
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${active ? "active" : ""}`}
              >
                <span className="sidebar-icon"><Icon /></span>
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
          ) : !elections ? (
            <Skeleton />
          ) : (
            <div className="space-y-6">
              {/* Hero */}
              <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
                   Create, review, and manage your course election ballots
                </p>
                <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Elections</h1>
                <p className="mt-3 max-w-xl font-sans text-brand-100/90">
                  {counts.active > 0
                    ? `${counts.active === 1 ? "1 election is" : `${counts.active} elections are`} open right now — voters can cast their ballots.`
                     : isSuperAdmin
                       ? "Nothing is open right now. Approve or open an election below when it is ready."
                       : "Nothing is open right now. Submit a completed draft for Super Admin approval before opening voting."}
                </p>
              </section>

              {/* action notice */}
              {notice && (
                <p role="status" className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-sans text-sm font-semibold text-emerald-800">
                  <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                  {notice}
                </p>
              )}

              {/* Stats from the list */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat label="Active now" value={counts.active} tone="brand" delay={80} icon={<PlayIcon className="h-5 w-5" />} />
                <MiniStat label="Scheduled" value={counts.upcoming} tone="amber" delay={160} icon={<CalendarIcon className="h-5 w-5" />} />
                <MiniStat label="Drafts" value={counts.draft} tone="sky" delay={240} icon={<PencilIcon className="h-5 w-5" />} />
                <MiniStat label="Results published" value={counts.published} tone="violet" delay={320} icon={<MegaphoneIcon className="h-5 w-5" />} />
              </section>

               {/* Create */}
               <CreateElectionForm onCreated={load} availableCourses={availableCourses} isSuperAdmin={isSuperAdmin} />
               {/* List */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-brand-900">All Elections</h2>
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 font-sans text-xs font-bold text-brand-700">
                    {total}
                  </span>
                </div>

                {total === 0 ? (
                  <div className="animate-fade-up rounded-2xl border-2 border-dashed border-brand-200 bg-white/60 p-14 text-center">
                    <ShieldIcon className="mx-auto h-12 w-12 text-brand-300" />
                    <h3 className="mt-4 font-bold text-brand-900">No elections yet</h3>
                    <p className="mt-1 font-sans text-sm text-ink-500">
                       Create your first election above — course moderators must receive Super Admin approval before opening voting.
                    </p>
                  </div>
                ) : (
                   sorted.map((election) => (
                     <ElectionRow key={election._id} election={election} onAction={onAction} onEdited={onEdited} busy={busy} availableCourses={availableCourses} isSuperAdmin={isSuperAdmin} />
                  ))
                )}
              </section>

              {/* Lifecycle hint — now matches your controller's real rules */}
              <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-100/70 p-4 font-sans text-sm text-brand-900">
                <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <span>
                   <strong>Lifecycle:</strong> Draft → Submit for approval → Super Admin approval → (Schedule) → Open voting → Close voting → Publish results.
                   Only approved elections can be scheduled or opened. Drafts can be edited or deleted; every create, approval,
                   open, publish, and edit is written to the audit log.
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
