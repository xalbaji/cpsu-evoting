// Shared application layout.
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { ThemeSettings } from "./ThemeSettings";
import Header from "./Header";
import Footer from "./Footer";
import { adminRoleLabel, hasSuperAdminAccess } from "../lib/access";

/* ─── Icons ─── */
const Icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  elections: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  voters: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  audit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  results: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  myVotes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h14v18l-2.33-1.5L14.33 21 12 19.5 9.67 21l-2.34-1.5L5 21V3Z" />
      <path d="m8.5 11.5 2.5 2.5 4.5-5" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  administrators: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3 3.4-4.5 6.5-4.5s5.7 1.5 6.5 4.5" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  ),
};

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
  superAdminOnly?: boolean;
};

const ADMIN_NAV: NavItem[] = [
  { path: "/admin/dashboard",  label: "Dashboard",   icon: Icons.dashboard },
  { path: "/admin/elections",  label: "Elections",   icon: Icons.elections },
  { path: "/admin/voters",     label: "Voters",      icon: Icons.voters },
  { path: "/voter/my-votes",   label: "My Votes",    icon: Icons.myVotes },
  { path: "/profile",          label: "Profile",     icon: Icons.profile },
  { path: "/admin/administrators", label: "Administrators", icon: Icons.administrators, superAdminOnly: true },
  { path: "/admin/audit-logs", label: "Audit Logs",  icon: Icons.audit },
  { path: "/admin/results",    label: "Results",     icon: Icons.results },
];

const VOTER_NAV: NavItem[] = [
  { path: "/voter/dashboard",  label: "Dashboard",   icon: Icons.dashboard },
  { path: "/voter/my-votes",   label: "My Votes",    icon: Icons.myVotes },
  { path: "/voter/audit-logs", label: "My Activity",  icon: Icons.audit },
  { path: "/voter/results",    label: "Results",     icon: Icons.results },
  { path: "/profile",          label: "Profile",     icon: Icons.profile },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  const navItems = (isAdmin ? ADMIN_NAV : VOTER_NAV)
    .filter((item) => !item.superAdminOnly || hasSuperAdminAccess(user))
    .filter((item) => !(isAdmin && hasSuperAdminAccess(user) && ["/profile", "/voter/my-votes"].includes(item.path)))
    .map((item) => item.path === "/admin/audit-logs" && !hasSuperAdminAccess(user)
      ? { ...item, label: "My Audit Logs" }
      : item);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* Global Top Header */}
      <Header
        user={user}
        isAdmin={isAdmin}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <div className="admin-page">
        {/* Mobile overlay */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        <div className="admin-layout">
          {/* Sidebar */}
          <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Navigation">
            <div>
              <p className="sidebar-section-label">
                {isAdmin ? "Administration" : "Voter Portal"}
              </p>

              <div className="sidebar-context">
                <span className="sidebar-context-dot" />
                <div>
                  <strong>{isAdmin ? `${adminRoleLabel(user)} workspace` : "Election workspace"}</strong>
                  <span>{isAdmin ? (hasSuperAdminAccess(user) ? "Manage every course" : "Managing assigned course elections") : "Your participation matters"}</span>
                </div>
              </div>

              <nav>
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? "active" : ""}`
                    }
                    onClick={() => setSidebarOpen(false)}
                    end={item.path === "/voter/dashboard" || item.path === "/admin/dashboard"}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {!isAdmin && (
              <div className="sidebar-trust-note">
                <span className="sidebar-trust-icon">✓</span>
                <div>
                  <strong>Your ballot is private</strong>
                  <span>Encrypted and anonymous from start to finish.</span>
                </div>
              </div>
            )}

            {/* Appearance settings pinned at bottom */}
            <div className="admin-sidebar-settings">
              <ThemeSettings />
            </div>
          </aside>

          {/* Main content */}
          <main className="admin-main">
            <Outlet />
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
