import { useCallback, useEffect, useMemo, useState } from "react";
import type { SVGProps } from "react";

import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";

/* ---------------- types ---------------- */
interface ProfileForm {
  firstName: string;
  lastName: string;
  course: string;
  yearLevel: string;
}

interface AccountInfo {
  email?: string;
  studentId?: string;
  firstName?: string;
  lastName?: string;
  course?: string;
  yearLevel?: string | number;
  avatarUrl?: string;
}

/* ---------------- icons ---------------- */
type Icon = SVGProps<SVGSVGElement>;
const UserIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="8" r="4" /><path d="M4 21c.9-4 4.2-6 8-6s7.1 2 8 6" />
  </svg>
);
const MailIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
  </svg>
);
const IdIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M5.5 17c.6-1.6 2-2.5 3.5-2.5s2.9.9 3.5 2.5M15 9h4M15 13h4" />
  </svg>
);
const BookIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
  </svg>
);
const GradCapIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m12 3 10 5-10 5L2 8l10-5Z" /><path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
  </svg>
);
const LockIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const CheckIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);
const ReceiptIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 3h14v18l-2.33-1.5L14.33 21 12 19.5 9.67 21l-2.34-1.5L5 21V3Z" /><path d="M9 8h6M9 12h6" />
  </svg>
);
const ClockIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);
const ShieldIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" />
  </svg>
);

/* ---------------- helpers ---------------- */
const initialsOf = (first?: string, last?: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";

const titleCase = (s: string) =>
  s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());

const YEAR_LEVELS = ["1", "2", "3", "4", "5"];

const COURSE_SUGGESTIONS = [
  "BSIT", "BSCS", "BSIS", "BSBA", "BSA", "BSAgriculture",
  "BSForestry", "BSEd", "BEEd", "BSNursing", "BSCriminology",
];

/* ---------------- page ---------------- */
export default function Profile() {
  const { user, setUser } = useAuth() as { user: AccountInfo | null; setUser: (user: any) => void };

  const [form, setForm] = useState<ProfileForm>({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    course: user?.course ?? "",
    yearLevel: user?.yearLevel != null ? String(user.yearLevel) : "",
  });
  const [snapshot, setSnapshot] = useState<ProfileForm>(form);
  const [account, setAccount] = useState<AccountInfo | null>(user);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [avatarError, setAvatarError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // voting activity — non-blocking, same endpoint as My Votes
  const [ballotsCast, setBallotsCast] = useState<number | null>(null);
  const [lastVoted, setLastVoted] = useState<string | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(snapshot),
    [form, snapshot],
  );
  const profileDirty = dirty || avatarUrl !== (account?.avatarUrl ?? "");

  useEffect(() => {
    // hydrate fresh data from the server (falls back silently to auth user)
    api
      .get("/users/profile")
      .then((res) => {
        const me = res.data?.data;
        if (!me) return;
        setAccount(me);
        setAvatarUrl(me.avatarUrl ?? "");
        const fresh: ProfileForm = {
          firstName: me.firstName ?? form.firstName,
          lastName: me.lastName ?? form.lastName,
          course: me.course ?? form.course,
          yearLevel: me.yearLevel != null ? String(me.yearLevel) : form.yearLevel,
        };
        setForm(fresh);
        setSnapshot(fresh);
      })
      .catch(() => {});

    api
      .get("/votes/my-status")
      .then((res) => {
        const votes = res.data?.data ?? [];
        setBallotsCast(votes.length);
        setLastVoted(votes[0]?.submittedAt ?? null);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: keyof ProfileForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const discard = () => setForm(snapshot);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Please choose an image smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  const saveProfile = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if ((!dirty && avatarUrl === (account?.avatarUrl ?? "")) || saving) return;
      setSaving(true);
      setMessage("");
      setError("");

      try {
        // PATCH /users/profile → updateProfile accepts exactly these 4 fields
        const response = await api.patch("/users/profile", {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          course: form.course.trim(),
          yearLevel: form.yearLevel,
          avatarUrl,
        });

        // server returns the saved user — resync so dirty-state clears
        const updated = response.data?.data;
        const saved: ProfileForm = {
          firstName: updated?.firstName ?? form.firstName.trim(),
          lastName: updated?.lastName ?? form.lastName.trim(),
          course: updated?.course ?? form.course.trim(),
          yearLevel: updated?.yearLevel != null ? String(updated.yearLevel) : form.yearLevel,
        };
        if (updated) setAccount(updated);
        if (updated) setUser(updated);
        if (updated?.avatarUrl) setAvatarUrl(updated.avatarUrl);
        setForm(saved);
        setSnapshot(saved);
        setMessage("Profile updated successfully.");
        window.setTimeout(() => setMessage(""), 4000);
        // If your AuthContext exposes setUser/refreshUser, call it here with
        // `updated` so the name in the navbar updates immediately.
      } catch (requestError: any) {
        setError(
          requestError?.response?.data?.message ?? "Unable to update profile.",
        );
      } finally {
        setSaving(false);
      }
    },
    [dirty, saving, form, avatarUrl, account?.avatarUrl, setUser],
  );

  const studentId = account?.studentId ?? "—";
  const displayName = `${form.firstName} ${form.lastName}`.trim() || "Your profile";
  const lastVotedLabel = lastVoted
    ? new Date(lastVoted).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Never";

  // make sure the select can display the stored value even if unusual
  const yearOptions = YEAR_LEVELS.includes(form.yearLevel)
    ? YEAR_LEVELS
    : [form.yearLevel, ...YEAR_LEVELS].filter(Boolean);

  return (
    <div className="space-y-8">
      {/* Hero / identity */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-xl sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="flex flex-wrap items-center gap-6">
          <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10 text-3xl font-extrabold ring-2 ring-white/25">
            {avatarUrl ? <img src={avatarUrl} alt="Your avatar" className="h-full w-full object-cover" /> : initialsOf(form.firstName, form.lastName)}
          </span>
          <div className="min-w-0">
            <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
              Voter profile
            </p>
            <h1 className="mt-1 truncate text-3xl font-extrabold sm:text-4xl">
              {titleCase(displayName)}
            </h1>
            <p className="mt-1 truncate font-sans text-brand-100/90">
              {account?.email ?? "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 font-sans text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
            <IdIcon className="h-3.5 w-3.5" /> {studentId}
          </span>
          {form.course && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
              <BookIcon className="h-3.5 w-3.5" /> {form.course.toUpperCase()}
            </span>
          )}
          {form.yearLevel && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
              <GradCapIcon className="h-3.5 w-3.5" /> Year {form.yearLevel}
            </span>
          )}
        </div>
      </section>

      {/* Voting activity */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="animate-fade-up flex items-center gap-4 rounded-2xl border border-brand-200 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ animationDelay: "80ms" }}>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-lg">
            <ReceiptIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-brand-900">{ballotsCast ?? "—"}</p>
            <p className="font-sans text-sm font-medium text-ink-500">Ballots cast</p>
          </div>
        </div>
        <div className="animate-fade-up flex items-center gap-4 rounded-2xl border border-brand-200 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ animationDelay: "160ms" }}>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-sky-500 to-indigo-500 text-white shadow-lg">
            <ClockIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-brand-900">{lastVotedLabel}</p>
            <p className="font-sans text-sm font-medium text-ink-500">Last voted</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Editable form — keeps your <form onSubmit> pattern */}
        <section className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm sm:p-8" style={{ animationDelay: "220ms" }}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-brand-900">
            <UserIcon className="h-5 w-5 text-brand-600" /> Edit profile
          </h2>
          <p className="mt-1 font-sans text-sm text-ink-500">
            Keep your details current — some elections are only open to specific courses or year levels.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-brand-200 bg-brand-50/70 p-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-200 text-xl font-extrabold text-brand-700 ring-2 ring-white shadow-sm">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" /> : initialsOf(form.firstName, form.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-brand-900">Profile picture</p>
              <p className="mt-0.5 font-sans text-xs text-ink-500">Use a clear square image. JPG, PNG, or WebP up to 2 MB.</p>
              {avatarError && <p className="mt-1 font-sans text-xs font-semibold text-danger-700">{avatarError}</p>}
            </div>
            <label className="cursor-pointer rounded-xl bg-brand-500 px-4 py-2.5 font-sans text-sm font-bold text-white shadow-sm transition hover:bg-brand-700">
              {avatarUrl ? "Change photo" : "Add photo"}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} className="sr-only" />
            </label>
          </div>

          {message && (
            <p role="status" className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-sans text-sm font-semibold text-emerald-800">
              <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
              {message}
            </p>
          )}
          {error && <p role="alert" className="mt-5">{error}</p>}

          <form onSubmit={saveProfile} className="mt-6 grid gap-5 sm:grid-cols-2">
            <label>
              First name
              <input
                required
                value={form.firstName}
                onChange={(e) => set("firstName")(e.target.value)}
                placeholder="Juan"
                className="mt-1"
              />
            </label>
            <label>
              Last name
              <input
                required
                value={form.lastName}
                onChange={(e) => set("lastName")(e.target.value)}
                placeholder="Dela Cruz"
                className="mt-1"
              />
            </label>
            <label>
              Course
              <input
                value={form.course}
                onChange={(e) => set("course")(e.target.value)}
                list="course-options"
                placeholder="BSIT"
                className="mt-1"
              />
              <datalist id="course-options">
                {COURSE_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label>
              Year level
              <select
                value={form.yearLevel}
                onChange={(e) => set("yearLevel")(e.target.value)}
                className="mt-1"
              >
                <option value="">Select year level…</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </label>

            {/* action bar */}
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              {profileDirty && (
                <span className="inline-flex items-center gap-1.5 font-sans text-xs font-bold text-amber-700">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Unsaved changes
                </span>
              )}
              <div className="ml-auto flex gap-3">
                {dirty && (
                  <button
                    type="button"
                    onClick={discard}
                    disabled={saving}
                    className="!bg-brand-100 !text-brand-700"
                  >
                    Discard
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!profileDirty || saving}
                  className="min-w-36 bg-linear-to-r from-brand-500 to-brand-700 shadow-md shadow-brand-500/30 transition hover:brightness-110 active:scale-95"
                >
                  {saving ? "Saving…" : "Save profile"}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Side column */}
        <div className="space-y-6">
          <section className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm" style={{ animationDelay: "300ms" }}>
            <h2 className="font-sans text-sm font-bold uppercase tracking-wide text-ink-400">
              Account details
            </h2>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700">
                  <MailIcon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-sans text-xs font-bold uppercase tracking-wide text-ink-400">Email</p>
                  <p className="truncate font-sans text-sm font-semibold text-ink-900">
                    {account?.email ?? "—"}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700">
                  <IdIcon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-sans text-xs font-bold uppercase tracking-wide text-ink-400">Student number</p>
                  <p className="font-mono text-sm font-semibold text-ink-900">{studentId}</p>
                </div>
              </li>
            </ul>
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-3 font-sans text-xs text-ink-600">
              <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              Email and student number are managed by the registrar and can't be edited here. Contact your administrator if they're wrong.
            </p>
          </section>

          <section className="animate-fade-up rounded-2xl border border-brand-200 bg-brand-100/70 p-6" style={{ animationDelay: "380ms" }}>
            <h2 className="flex items-center gap-2 font-bold text-brand-900">
              <ShieldIcon className="h-5 w-5 text-brand-600" /> Your privacy
            </h2>
            <p className="mt-2 font-sans text-sm text-ink-600">
              Your identity is only used to verify eligibility. Once your ballot is cast, your votes are stored
              separately — no one can connect <em>who you are</em> with <em>what you chose</em>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
