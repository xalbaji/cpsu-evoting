import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import BrandLogo from "../../components/BrandLogo";
import { ThemeSettings } from "../../components/ThemeSettings";
import { CPSU_MAIN_COURSES } from "../../lib/courses";
import { adminRoleLabel, displayAccountName, hasSuperAdminAccess } from "../../lib/access";

interface ManagedAdmin {
  _id: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  email: string;
  course?: string;
  managedCourses?: string[];
  isSuperAdmin?: boolean;
  isActive: boolean;
}

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3 3.4-4.5 6.5-4.5s5.7 1.5 6.5 4.5" />
    <path d="M16 5a3.5 3.5 0 0 1 0 6.6M18.5 15.7c1.6.7 2.6 1.9 3 3.3" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </svg>
);

const NAV_ITEMS = [
  {
    path: "/admin/dashboard",
    label: "Dashboard",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  },
  {
    path: "/admin/elections",
    label: "Elections",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>,
  },
  {
    path: "/admin/voters",
    label: "Voters",
    icon: <UsersIcon />,
  },
  {
    path: "/voter/my-votes",
    label: "My Votes",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h14v18l-2.33-1.5L14.33 21 12 19.5 9.67 21l-2.34-1.5L5 21V3Z" /><path d="m8.5 11.5 2.5 2.5 4.5-5" /></svg>,
  },
  {
    path: "/profile",
    label: "Profile",
    icon: <UsersIcon />,
  },
  {
    path: "/admin/administrators",
    label: "Administrators",
    icon: <UsersIcon />,
  },
  {
    path: "/admin/audit-logs",
    label: "Audit Logs",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  },
  {
    path: "/admin/results",
    label: "Results",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>,
  },
];

const MenuIcon = ({ close = false }: { close?: boolean }) => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    {close ? <><path d="M18 6 6 18" /><path d="M6 6l12 12" /></> : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>}
  </svg>
);

const initials = (admin: ManagedAdmin) =>
  `${admin.firstName[0] ?? ""}${admin.lastName[0] ?? ""}`.toUpperCase() || "?";

function isCpsuAdministrator(admin: ManagedAdmin) {
  return admin.email.trim().toLowerCase() === "admin@cpsu.edu"
    || admin.studentId === "ADMIN-0001"
    || (admin.firstName.trim().toLowerCase() === "cpsu" && admin.lastName.trim().toLowerCase() === "administrator");
}

function isSuperAdminAccount(admin: ManagedAdmin) {
  return admin.isSuperAdmin === true || isCpsuAdministrator(admin);
}

function assignedCourses(admin: ManagedAdmin) {
  if (isSuperAdminAccount(admin)) return CPSU_MAIN_COURSES.map((course) => course.code);
  return Array.from(new Set((admin.managedCourses ?? []).map((course) => course.toUpperCase())));
}

export default function Administrators() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [admins, setAdmins] = useState<ManagedAdmin[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { managedCourses: string[]; isSuperAdmin: boolean }>>({});
  const [selectedCourse, setSelectedCourse] = useState("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/users/admins");
      const nextAdmins: ManagedAdmin[] = response.data?.data ?? [];
      setAdmins(nextAdmins);
      setDrafts(Object.fromEntries(nextAdmins.map((admin) => [admin._id, {
        managedCourses: isSuperAdminAccount(admin)
          ? []
          : (admin.managedCourses ?? []),
        isSuperAdmin: isSuperAdminAccount(admin),
      }])));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Unable to load administrators.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasSuperAdminAccess(user)) load();
  }, [load, user]);

  const filteredAdmins = useMemo(
    () => selectedCourse === "ALL"
      ? admins
      : admins.filter((admin) => assignedCourses(admin).includes(selectedCourse)),
    [admins, selectedCourse],
  );

  if (!hasSuperAdminAccess(user)) return <Navigate to="/admin/dashboard" replace />;
  const currentUserId = user?._id;

  const updateDraft = (id: string, changes: Partial<{ managedCourses: string[]; isSuperAdmin: boolean }>) => {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...changes } }));
  };

  const save = async (admin: ManagedAdmin) => {
    const draft = drafts[admin._id];
    if (!draft) return;
    const protectedSuperAdmin = isCpsuAdministrator(admin);
    const nextIsSuperAdmin = protectedSuperAdmin || draft.isSuperAdmin;
    setSavingId(admin._id);
    setError("");
    try {
      await api.patch(`/users/admins/${admin._id}/scope`, {
        managedCourses: nextIsSuperAdmin ? [] : draft.managedCourses,
        isSuperAdmin: nextIsSuperAdmin,
      });
      setAdmins((current) => current.map((item) => item._id === admin._id
        ? { ...item, managedCourses: nextIsSuperAdmin ? [] : draft.managedCourses, isSuperAdmin: nextIsSuperAdmin }
        : item));
      setEditingId(null);
      setNotice(`${admin.firstName} ${admin.lastName}'s access was updated.`);
      window.setTimeout(() => setNotice(""), 3500);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Unable to update administrator access.");
    } finally {
      setSavingId(null);
    }
  };

  const demote = async (admin: ManagedAdmin) => {
    if (admin._id === currentUserId || isCpsuAdministrator(admin)) {
      setError(isCpsuAdministrator(admin)
        ? "The CPSU Administrator account must remain a Super Admin."
        : "You cannot remove your own administrator access.");
      return;
    }
    if (!window.confirm(`Remove administrator access from ${admin.firstName} ${admin.lastName}? They will become a voter again.`)) return;

    setSavingId(admin._id);
    setError("");
    try {
      await api.post(`/users/admins/${admin._id}/demote`);
      setAdmins((current) => current.filter((item) => item._id !== admin._id));
      setDrafts((current) => {
        const next = { ...current };
        delete next[admin._id];
        return next;
      });
      setEditingId(null);
      setNotice(`${admin.firstName} ${admin.lastName} is now a voter again.`);
      window.setTimeout(() => setNotice(""), 3500);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Unable to remove administrator access.");
    } finally {
      setSavingId(null);
    }
  };

  const courseAdminCount = admins.filter((admin) => !isSuperAdminAccount(admin)).length;
  const allCourseAdminCount = admins.filter((admin) => isSuperAdminAccount(admin)).length;
  const coveredCourseCount = CPSU_MAIN_COURSES.filter((course) =>
    admins.some((admin) => assignedCourses(admin).includes(course.code)),
  ).length;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-page min-h-screen bg-brand-50 pt-16 font-serif text-ink-900">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between gap-4 bg-brand-900 px-4 font-sans text-white shadow-md lg:px-6">
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-lg p-2 transition hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
            <MenuIcon close={sidebarOpen} />
          </button>
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1"><BrandLogo /></span>
          <span className="hidden text-[1.05rem] font-semibold tracking-wide sm:block">CPSU E-Voting</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-brand-300">{displayAccountName(user, "CPSU Administrator")}</span>
          <span className="header-role-badge">{adminRoleLabel(user)}</span>
          <button type="button" onClick={handleLogout} className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20 active:scale-95">Log out</button>
        </div>
      </header>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`admin-dashboard-sidebar fixed bottom-0 left-0 top-16 z-40 w-64 border-r border-brand-200 bg-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
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
            if (["/profile", "/voter/my-votes"].includes(item.path) && hasSuperAdminAccess(user)) return null;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`sidebar-link ${active ? "active" : ""}`}>
                <span className="sidebar-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-settings"><ThemeSettings /></div>
      </aside>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
          <div className="administrators-page space-y-5">
            <Link to="/admin/dashboard" className="administrators-back inline-flex items-center gap-2 font-sans text-sm font-bold text-brand-600 hover:underline">
              <span aria-hidden="true">←</span>
              Return to dashboard
            </Link>

            <section className="administrators-hero animate-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 p-6 text-white shadow-xl sm:p-7">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-300">Super administrator workspace</p>
              <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Course moderators</h1>
              <p className="mt-2 max-w-2xl font-sans text-sm leading-6 text-brand-100/90 sm:text-base">
                Review every voter you promoted, see their course access, and keep administrator permissions organized in one place.
              </p>
            </section>

            {notice && <p role="status" className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-sans text-sm font-semibold text-emerald-800">{notice}</p>}
            {error && <p role="alert" className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 font-sans text-sm font-semibold text-danger-700">{error}</p>}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="admin-directory-stat"><UsersIcon /><strong>{admins.length}</strong><span>Total administrators</span></div>
              <div className="admin-directory-stat"><ShieldIcon /><strong>{courseAdminCount}</strong><span>Course moderators</span></div>
              <div className="admin-directory-stat"><ShieldIcon /><strong>{allCourseAdminCount}</strong><span>Super administrators</span></div>
              <div className="admin-directory-stat"><UsersIcon /><strong>{coveredCourseCount}</strong><span>Courses covered</span></div>
            </section>

            <section className="administrators-directory animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-brand-900">Promoted moderators</h2>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 font-sans text-xs font-bold text-brand-700">{filteredAdmins.length}</span>
            </div>
            <p className="mt-1 font-sans text-sm text-ink-500">Filter the directory to confirm who manages a particular course.</p>
          </div>
          <label className="admin-directory-filter min-w-56 font-sans text-xs font-bold uppercase tracking-wide text-ink-500">
            Filter by course
            <select value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)} className="mt-1">
              <option value="ALL">All courses</option>
              {CPSU_MAIN_COURSES.map((course) => <option key={course.code} value={course.code}>{course.code}</option>)}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-brand-200/70" />)}
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-10 text-center">
            <UsersIcon />
            <h3 className="mt-3 font-bold text-brand-900">No administrators found</h3>
            <p className="mt-1 font-sans text-sm text-ink-500">Promote a voter from Voter Management or choose another course.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {filteredAdmins.map((admin) => {
              const draft = drafts[admin._id];
              const isEditing = editingId === admin._id;
              const courses = assignedCourses(admin);
              return (
                <article key={admin._id} className="admin-directory-card">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-brand-500 to-brand-700 font-sans text-sm font-extrabold text-white shadow-md">{initials(admin)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="m-0 truncate font-bold text-brand-900">{admin.firstName} {admin.lastName}</h3>
                        {isSuperAdminAccount(admin)
                          ? <span className="admin-directory-badge">All courses</span>
                          : <span className="admin-directory-badge">Course Moderator</span>}
                      </div>
                      <p className="mt-1 truncate font-sans text-sm text-ink-500">{admin.email}</p>
                      {admin.studentId && <p className="mt-1 font-mono text-xs text-ink-400">{admin.studentId}</p>}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="admin-directory-label">Access scope</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {isSuperAdminAccount(admin)
                        ? <span className="admin-course-chip admin-course-chip-wide">All CPSU Main Campus courses</span>
                        : courses.map((course) => <span key={course} className="admin-course-chip">{course}</span>)}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-brand-100 pt-4">
                    <button type="button" onClick={() => setEditingId(isEditing ? null : admin._id)} disabled={savingId === admin._id} className="admin-directory-button">
                      <EditIcon /> {isEditing ? "Close editor" : "Edit access"}
                    </button>
                    <button type="button" onClick={() => demote(admin)} disabled={savingId === admin._id || admin._id === currentUserId || isCpsuAdministrator(admin)} className="admin-directory-button admin-directory-button-danger">
                      {isCpsuAdministrator(admin) ? "Protected account" : "Remove admin"}
                    </button>
                  </div>

                  {isEditing && draft && (
                    <div className="admin-directory-editor mt-4 border-t border-brand-100 pt-4">
                      <label>
                        Courses managed
                        <select
                          multiple
                          size={5}
                          value={draft.managedCourses}
                          disabled={draft.isSuperAdmin}
                          onChange={(event) => updateDraft(admin._id, { managedCourses: Array.from(event.target.selectedOptions, (option) => option.value) })}
                          className="admin-directory-course-select mt-1"
                        >
                          {CPSU_MAIN_COURSES.map((course) => <option key={course.code} value={course.code}>{course.code}</option>)}
                        </select>
                      </label>
                      <div className="admin-directory-editor-actions">
                        <label className="flex items-center gap-2 font-sans text-xs font-bold normal-case tracking-normal text-ink-600">
                          <input type="checkbox" checked={draft.isSuperAdmin} disabled={isCpsuAdministrator(admin)} onChange={(event) => updateDraft(admin._id, { isSuperAdmin: event.target.checked })} />
                          All courses
                        </label>
                        <button type="button" onClick={() => save(admin)} disabled={savingId === admin._id} className="!px-4 !py-2 !text-xs">
                          {savingId === admin._id ? "Saving…" : "Save access"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
