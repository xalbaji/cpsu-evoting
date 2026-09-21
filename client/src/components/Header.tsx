// src/components/Header.tsx
import { NavLink } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import type { User } from "../lib/auth.types";
import { adminRoleLabel, displayAccountName } from "../lib/access";

interface HeaderProps {
  user?: User | null;
  isAdmin?: boolean;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
}

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6"  x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="18" y1="6"  x2="6"  y2="18" />
    <line x1="6"  y1="6"  x2="18" y2="18" />
  </svg>
);

const LogOutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Header({
  user,
  isAdmin,
  sidebarOpen,
  onToggleSidebar,
  onLogout,
}: HeaderProps) {
  const displayName = displayAccountName(user, isAdmin ? "Course Moderator" : "Student");

  const initials =
    (user?.firstName?.[0] ?? "C").toUpperCase() +
    (user?.lastName?.[0] ?? "").toUpperCase();

  return (
    <header className="app-header" role="banner">
      {/* Left side */}
      <div className="app-header-left">
        <button
          className="header-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div className="header-logo-box">
          <BrandLogo />
        </div>

        <NavLink
          className="header-brand"
          to={isAdmin ? "/admin/dashboard" : "/voter/dashboard"}
          aria-label="CPSU E-Voting home"
        >
          CPSU E-Voting
          <span>Central Philippine State University</span>
        </NavLink>
      </div>

      {/* Right side */}
      <div className="app-header-right">
        <span className="header-role-badge">
          {isAdmin ? adminRoleLabel(user) : "Voter"}
        </span>

        <span className="header-user-name">{displayName}</span>

        {user?.avatarUrl ? (
          <img
            className="header-avatar"
            src={user.avatarUrl}
            alt="Your profile"
          />
        ) : (
          <span className="header-avatar" aria-hidden="true">
            {initials}
          </span>
        )}

        <button
          className="header-logout"
          onClick={onLogout}
          id="header-logout-btn"
        >
          <LogOutIcon />
          Log out
        </button>
      </div>
    </header>
  );
}
