import { useCallback, useEffect, useRef, useState } from "react";
import { Fragment } from "react";
import type { SVGProps } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { api } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";

/* ---------------- types (matches getUsers) ---------------- */
interface Voter {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  course?: string;
  yearLevel?: string | number;
  avatarUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  hasVoted?: boolean;
  createdAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ImportResult {
  imported: number;
  rejected: number;
  errors: string[];
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
const UserPlusIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3 3.4-4.5 6.5-4.5s5.7 1.5 6.5 4.5" /><path d="M19 8v6M22 11h-6" />
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
const UploadIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" />
  </svg>
);
const TrashIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" />
  </svg>
);
const CheckIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);
const XIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
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
const ChevronLeftIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const ChevronRightIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const ReceiptIcon = (p: Icon) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 3h14v18l-2.33-1.5L14.33 21 12 19.5 9.67 21l-2.34-1.5L5 21V3Z" /><path d="M9 8h6M9 12h6" />
  </svg>
);

/* ---------------- nav (same as other admin pages) ---------------- */
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
        <p className="text-2xl font-extrabold tabular-nums text-brand-900">{value.toLocaleString()}</p>
        <p className="font-sans text-sm font-medium text-ink-500">{label}</p>
      </div>
    </div>
  );
}

function Badge({ tone, children }: { tone: "green" | "slate" | "amber" | "red" | "brand"; children: React.ReactNode }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/25",
    slate: "bg-slate-100 text-slate-500 ring-1 ring-slate-500/15",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/25",
    red:   "bg-danger-50 text-danger-700 ring-1 ring-danger-700/20",
    brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-500/25",
  }[tone];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-sans text-xs font-bold ${styles}`}>
      {children}
    </span>
  );
}

function Avatar({ firstName, lastName, avatarUrl }: { firstName: string; lastName: string; avatarUrl?: string }) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-brand-500 to-brand-700 font-sans text-xs font-extrabold text-white">
      {avatarUrl ? <img src={avatarUrl} alt={`${firstName} ${lastName}`} className="h-full w-full object-cover" /> : initials}
    </span>
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
      <div className="h-96 animate-pulse rounded-2xl bg-brand-200/70" />
    </div>
  );
}

/* ---------------- page ---------------- */
const PAGE_SIZE = 10;

export default function Voters() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [voters, setVoters] = useState<Voter[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");          // committed
  const [searchInput, setSearchInput] = useState(""); // typing
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [editStudentId, setEditStudentId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // CSV import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useCallback(async (opts?: { page?: number; search?: string }) => {
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(opts?.page ?? page));
      params.set("limit", String(PAGE_SIZE));
      const s = opts?.search ?? search;
      if (s.trim()) params.set("search", s.trim());

      // ✅ GET /users?search=&page=&limit= — getUsers
      const response = await api.get(`/users?${params.toString()}`);
      setVoters(response.data?.data ?? []);
      setPagination(response.data?.pagination ?? null);
    } catch {
      setError("Unable to load voters.");
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    load({ page: 1, search: searchInput });
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
    load({ page: 1, search: "" });
  };

  const beginEdit = (voter: Voter) => {
    setEditingVoter(voter);
    setEditStudentId(voter.studentId);
    setNewPassword("");
  };

  const cancelEdit = () => {
    setEditingVoter(null);
    setEditStudentId("");
    setNewPassword("");
  };

  const saveAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingVoter || editSaving) return;
    if (newPassword && newPassword.length < 8) {
      window.alert("New password must be at least 8 characters.");
      return;
    }

    setEditSaving(true);
    try {
      const payload: { studentId: string; newPassword?: string } = {
        studentId: editStudentId.trim(),
      };
      if (newPassword) payload.newPassword = newPassword;
      await api.patch(`/users/${editingVoter._id}`, payload);
      await load();
      flash(`${editingVoter.firstName} ${editingVoter.lastName}'s account was updated.`);
      cancelEdit();
    } catch (err: any) {
      window.alert(err?.response?.data?.message ?? "Unable to update the account.");
    } finally {
      setEditSaving(false);
    }
  };

  /* ✅ PATCH /users/:id — updateUser allowedFields: isActive, isVerified */
  const toggleField = async (voter: Voter, field: "isActive" | "isVerified") => {
    const next = !voter[field];
    const verb = field === "isActive"
      ? next ? "Reactivate" : "Deactivate"
      : next ? "Verify" : "Unverify";

    if (!window.confirm(`${verb} ${voter.firstName} ${voter.lastName}?`)) return;

    setRowBusy(voter._id);
    try {
      await api.patch(`/users/${voter._id}`, { [field]: next });
      await load();
      flash(`${voter.firstName} ${voter.lastName} ${next ? "is now" : "was"} ${field === "isActive" ? (next ? "active" : "deactivated") : (next ? "verified" : "unverified")}.`);
    } catch (err: any) {
      window.alert(err?.response?.data?.message ?? "Unable to update the voter.");
    } finally {
      setRowBusy(null);
    }
  };

  /* ✅ DELETE /users/:id — deleteVoter (VOTER role only) */
  const remove = async (voter: Voter) => {
    if (!window.confirm(
      `Permanently delete ${voter.firstName} ${voter.lastName} (${voter.studentId})?\n\nThis cannot be undone.`,
    )) return;

    setRowBusy(voter._id);
    try {
      await api.delete(`/users/${voter._id}`);
      await load();
      flash("Voter deleted.");
    } catch (err: any) {
      window.alert(err?.response?.data?.message ?? "Unable to delete the voter.");
    } finally {
      setRowBusy(null);
    }
  };

  /* ✅ POST /users/import — multipart, field name "file" */
  const importCsv = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      window.alert("Choose a CSV file first.");
      return;
    }

    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/users/import", formData);
      const result: ImportResult = response.data?.data ?? { imported: 0, rejected: 0, errors: [] };
      setImportResult(result);
      if (fileRef.current) fileRef.current.value = "";
      setPage(1);
      await load({ page: 1 });
    } catch (err: any) {
      window.alert(err?.response?.data?.message ?? "Import failed — check the CSV columns.");
    } finally {
      setImporting(false);
    }
  };

  const total = pagination?.total ?? voters?.length ?? 0;
  const votedOnPage = (voters ?? []).filter((v) => v.hasVoted).length;
  const unverifiedOnPage = (voters ?? []).filter((v) => !v.isVerified).length;
  const inactiveOnPage = (voters ?? []).filter((v) => !v.isActive).length;

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
          ) : !voters ? (
            <Skeleton />
          ) : (
            <div className="space-y-6">
              {/* Hero */}
              <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-300">
                  Search, verify, and manage registered voter accounts
                </p>
                <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Voter Management</h1>
                <p className="mt-3 max-w-xl font-sans text-brand-100/90">
                  {search
                    ? `Showing results for “${search}”.`
                    : total > 0
                      ? `${total.toLocaleString()} registered ${total === 1 ? "voter" : "voters"} — activate accounts, verify identities, and import new voters by CSV.`
                      : "No voters registered yet. Import a CSV below to add your first batch."}
                </p>
              </section>

              {/* action notice */}
              {notice && (
                <p role="status" className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-sans text-sm font-semibold text-emerald-800">
                  <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                  {notice}
                </p>
              )}

              {/* Stats */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat label="Registered voters" value={total} tone="brand" delay={80} icon={<UsersIcon className="h-5 w-5" />} />
                <MiniStat label="Voted on this page" value={votedOnPage} tone="sky" delay={160} icon={<ReceiptIcon className="h-5 w-5" />} />
                <MiniStat label="Unverified (page)" value={unverifiedOnPage} tone="amber" delay={240} icon={<UserPlusIcon className="h-5 w-5" />} />
                <MiniStat label="Inactive (page)" value={inactiveOnPage} tone="violet" delay={320} icon={<XIcon className="h-5 w-5" />} />
              </section>

              {/* Search + Import */}
              <section className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm">
                <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                  <form onSubmit={submitSearch}>
                    <label className="font-sans text-xs font-bold uppercase tracking-wide text-ink-400">
                      Search voters
                    </label>
                    <div className="mt-2 flex gap-3">
                      <div className="relative flex-1">
                        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
                        <input
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder="Student ID, name, or email…"
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
                    </div>
                  </form>

                  <form onSubmit={importCsv}>
                    <label className="font-sans text-xs font-bold uppercase tracking-wide text-ink-400">
                      Import voters (CSV)
                    </label>
                    <div className="mt-2 flex gap-3">
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".csv"
                        className="min-w-0 flex-1 rounded-xl py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:font-sans file:text-xs file:font-bold file:text-brand-700"
                      />
                      <button type="submit" disabled={importing} className="!px-4 active:scale-95">
                        <span className="inline-flex items-center gap-1.5">
                          <UploadIcon className="h-4 w-4" />
                          {importing ? "Importing…" : "Import"}
                        </span>
                      </button>
                    </div>
                    <p className="mt-2 font-sans text-[11px] text-ink-500">
                      Required columns: <code className="font-mono">studentId, firstName, lastName, email, course, yearLevel</code>
                    </p>
                  </form>
                </div>

                {/* import result */}
                {importResult && (
                  <div className={`mt-5 rounded-xl border p-4 font-sans text-sm ${
                    importResult.rejected === 0
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}>
                    <p className="font-bold">
                      ✅ Imported {importResult.imported} {importResult.imported === 1 ? "voter" : "voters"}
                      {importResult.rejected > 0 && ` · ⚠ ${importResult.rejected} rejected`}
                    </p>
                    {importResult.errors.length > 0 && (
                      <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                        {importResult.errors.map((e, i) => (
                          <li key={i}>• {e}</li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => setImportResult(null)}
                      className="mt-2 font-bold underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </section>

              {/* Table */}
              <section className="animate-fade-up overflow-hidden rounded-2xl border border-brand-200 bg-white/90 shadow-sm">
                <div className="flex items-center gap-3 border-b border-brand-100 px-6 py-4">
                  <h2 className="text-lg font-bold text-brand-900">
                    {search ? `Results for “${search}”` : "All Voters"}
                  </h2>
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 font-sans text-xs font-bold text-brand-700">
                    {total.toLocaleString()}
                  </span>
                </div>

                {voters.length === 0 ? (
                  <div className="p-14 text-center">
                    <UsersIcon className="mx-auto h-12 w-12 text-brand-300" />
                    <h3 className="mt-4 font-bold text-brand-900">
                      {search ? "No voters match your search" : "No voters registered yet"}
                    </h3>
                    <p className="mt-1 font-sans text-sm text-ink-500">
                      {search
                        ? "Try a different student ID, name, or email."
                        : "Import a CSV file above to bulk-register voters."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] border-collapse text-left font-sans">
                      <thead>
                        <tr className="bg-brand-50/80 text-xs uppercase tracking-wide text-ink-500">
                          <th className="px-6 py-3.5 font-bold">Voter</th>
                          <th className="px-4 py-3.5 font-bold">Student ID</th>
                          <th className="px-4 py-3.5 font-bold">Course · Year</th>
                          <th className="px-4 py-3.5 font-bold">Status</th>
                          <th className="px-4 py-3.5 font-bold">Verified</th>
                          <th className="px-4 py-3.5 font-bold">Voting</th>
                          <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-100">
                        {voters.map((voter) => {
                          const busy = rowBusy === voter._id;
                          return (
                            <Fragment key={voter._id}>
                            <tr className="transition-colors hover:bg-brand-50/40">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar firstName={voter.firstName} lastName={voter.lastName} avatarUrl={voter.avatarUrl} />
                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-ink-900">
                                      {voter.firstName} {voter.lastName}
                                    </p>
                                    <p className="truncate text-xs text-ink-500">{voter.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-mono text-xs font-semibold text-ink-700">
                                {voter.studentId}
                              </td>
                              <td className="px-4 py-4 text-sm text-ink-600">
                                {voter.course || "—"}
                                {voter.yearLevel != null && voter.yearLevel !== "" && (
                                  <span className="text-ink-400"> · Yr {voter.yearLevel}</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                {voter.isActive
                                  ? <Badge tone="green">Active</Badge>
                                  : <Badge tone="red">Inactive</Badge>}
                              </td>
                              <td className="px-4 py-4">
                                {voter.isVerified
                                  ? <Badge tone="brand">✓ Yes</Badge>
                                  : <Badge tone="amber">No</Badge>}
                              </td>
                              <td className="px-4 py-4">
                                {voter.hasVoted
                                  ? <Badge tone="green">Voted</Badge>
                                  : <Badge tone="slate">Not yet</Badge>}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => beginEdit(voter)}
                                    disabled={busy}
                                    className="!bg-white !px-3 !py-1.5 !text-xs !text-brand-700 ring-1 ring-brand-300 hover:!bg-brand-50 active:scale-95"
                                  >
                                    Edit account
                                  </button>
                                  <button
                                    onClick={() => toggleField(voter, "isActive")}
                                    disabled={busy}
                                    className={`!px-3 !py-1.5 !text-xs active:scale-95 ${
                                      voter.isActive
                                        ? "!bg-white !text-ink-700 ring-1 ring-brand-300 hover:!bg-brand-50"
                                        : ""
                                    }`}
                                  >
                                    {voter.isActive ? "Deactivate" : "Activate"}
                                  </button>
                                  <button
                                    onClick={() => toggleField(voter, "isVerified")}
                                    disabled={busy}
                                    className={`!px-3 !py-1.5 !text-xs active:scale-95 ${
                                      voter.isVerified
                                        ? "!bg-white !text-ink-700 ring-1 ring-brand-300 hover:!bg-brand-50"
                                        : ""
                                    }`}
                                  >
                                    {voter.isVerified ? "Unverify" : "Verify"}
                                  </button>
                                  <button
                                    onClick={() => remove(voter)}
                                    disabled={busy}
                                    className="!bg-white !px-2.5 !py-1.5 !text-danger-700 ring-1 ring-danger-700/30 hover:!bg-danger-50 active:scale-95"
                                    aria-label={`Delete ${voter.firstName}`}
                                    title="Delete voter"
                                  >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {editingVoter?._id === voter._id && (
                              <tr key={`${voter._id}-edit`} className="bg-brand-50/60">
                                <td colSpan={7} className="px-6 py-5">
                                  <form onSubmit={saveAccount} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
                                    <label>
                                      Student ID
                                      <input
                                        required
                                        value={editStudentId}
                                        onChange={(event) => setEditStudentId(event.target.value)}
                                        className="mt-1"
                                      />
                                    </label>
                                    <label>
                                      New password
                                      <input
                                        type="password"
                                        minLength={8}
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                        placeholder="Leave blank to keep current"
                                        className="mt-1"
                                      />
                                    </label>
                                    <button type="submit" disabled={editSaving} className="!py-2.5 active:scale-95">
                                      {editSaving ? "Saving…" : "Save changes"}
                                    </button>
                                    <button type="button" onClick={cancelEdit} disabled={editSaving} className="!bg-white !py-2.5 !text-ink-700 ring-1 ring-brand-300 hover:!bg-brand-50">
                                      Cancel
                                    </button>
                                  </form>
                                  <p className="mt-3 font-sans text-xs text-ink-500">
                                    Passwords are write-only. The current password cannot be viewed by administrators.
                                  </p>
                                </td>
                              </tr>
                            )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-between gap-4 border-t border-brand-100 px-6 py-4 font-sans text-sm">
                    <span className="text-xs text-ink-500">
                      Page {pagination.page} of {pagination.pages} · {pagination.total.toLocaleString()} total
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={pagination.page <= 1}
                        className="!bg-white !p-2 !text-ink-700 ring-1 ring-brand-300 hover:!bg-brand-50 active:scale-95 disabled:opacity-40"
                        aria-label="Previous page"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 font-bold text-white">
                        {pagination.page}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                        disabled={pagination.page >= pagination.pages}
                        className="!bg-white !p-2 !text-ink-700 ring-1 ring-brand-300 hover:!bg-brand-50 active:scale-95 disabled:opacity-40"
                        aria-label="Next page"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Footer note */}
              <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-100/70 p-4 font-sans text-sm text-brand-900">
                <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <span>
                  <strong>Eligibility:</strong> only <em>active</em> accounts can log in and vote. Verification marks that
                  a voter's identity was checked against the registrar. The voting status column reflects cast ballots —
                  but never reveals <em>what</em> anyone voted for.
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
